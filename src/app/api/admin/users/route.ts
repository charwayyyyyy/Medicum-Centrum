import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

// Schema for user role update validation
const userRoleSchema = z.object({
  role: z.enum(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']),
})

// GET /api/admin/users
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access user management' },
        { status: 403 }
      )
    }

    // Get all users with their profiles
    const users = await prisma.user.findMany({
      include: {
        patient: true,
        doctor: true,
        nurse: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format the response
    const formattedUsers = users.map((user) => {
      let profile = user.patient || user.doctor || user.nurse
      return {
        id: user.id,
        email: user.email,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }
    })

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/:userId
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update user roles' },
        { status: 403 }
      )
    }

    const userId = req.url.split('/').pop()
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { role } = userRoleSchema.parse(body)

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true,
        nurse: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Start a transaction to update user role and create/delete role-specific profiles
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // Delete existing role-specific profiles
      if (currentUser.patient) {
        await prisma.patient.delete({ where: { id: currentUser.patient.id } })
      }
      if (currentUser.doctor) {
        await prisma.doctor.delete({ where: { id: currentUser.doctor.id } })
      }
      if (currentUser.nurse) {
        await prisma.nurse.delete({ where: { id: currentUser.nurse.id } })
      }

      // Create new role-specific profile
      const profileData = {
        userId,
        firstName: currentUser.patient?.firstName ||
          currentUser.doctor?.firstName ||
          currentUser.nurse?.firstName ||
          '',
        lastName: currentUser.patient?.lastName ||
          currentUser.doctor?.lastName ||
          currentUser.nurse?.lastName ||
          '',
      }

      switch (role) {
        case 'PATIENT':
          await prisma.patient.create({ data: profileData })
          break
        case 'DOCTOR':
          await prisma.doctor.create({
            data: {
              ...profileData,
              specialization: 'General',
            },
          })
          break
        case 'NURSE':
          await prisma.nurse.create({ data: profileData })
          break
      }

      // Update user role
      return prisma.user.update({
        where: { id: userId },
        data: { role },
        include: {
          patient: true,
          doctor: true,
          nurse: true,
        },
      })
    })

    // Format the response
    const profile = updatedUser.patient || updatedUser.doctor || updatedUser.nurse
    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      role: updatedUser.role,
      createdAt: updatedUser.createdAt.toISOString(),
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('Error updating user role:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid role', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}