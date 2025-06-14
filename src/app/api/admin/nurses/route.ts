import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/nurses
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access nurse management' },
        { status: 403 }
      )
    }

    // Get all nurses with their schedules and assignments
    const nurses = await prisma.nurse.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            createdAt: true,
          },
        },
        schedule: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
        assignments: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
              },
            },
            tasks: {
              where: {
                status: 'PENDING',
              },
              include: {
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    })

    return NextResponse.json(nurses)
  } catch (error) {
    console.error('Error fetching nurses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nurses' },
      { status: 500 }
    )
  }
}

// POST /api/admin/nurses
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create nurses' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, firstName, lastName, doctorIds } = body

    // Validate input
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user and nurse profile with doctor assignments
    const nurse = await prisma.user.create({
      data: {
        email,
        role: 'NURSE',
        nurse: {
          create: {
            firstName,
            lastName,
            assignments: doctorIds
              ? {
                  create: doctorIds.map((doctorId: string) => ({
                    doctorId,
                  })),
                }
              : undefined,
          },
        },
      },
      include: {
        nurse: {
          include: {
            assignments: {
              include: {
                doctor: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(nurse, { status: 201 })
  } catch (error) {
    console.error('Error creating nurse:', error)
    return NextResponse.json(
      { error: 'Failed to create nurse' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/nurses/:nurseId
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update nurses' },
        { status: 403 }
      )
    }

    const nurseId = req.url.split('/').pop()
    if (!nurseId) {
      return NextResponse.json(
        { error: 'Nurse ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { firstName, lastName, doctorIds } = body

    // Start a transaction to update nurse profile and assignments
    const nurse = await prisma.$transaction(async (prisma) => {
      // Update nurse profile
      const updatedNurse = await prisma.nurse.update({
        where: { id: nurseId },
        data: {
          firstName,
          lastName,
        },
      })

      // Update doctor assignments if provided
      if (doctorIds) {
        // Delete existing assignments
        await prisma.nurseAssignment.deleteMany({
          where: { nurseId },
        })

        // Create new assignments
        await prisma.nurseAssignment.createMany({
          data: doctorIds.map((doctorId: string) => ({
            nurseId,
            doctorId,
          })),
        })
      }

      // Return updated nurse with assignments
      return prisma.nurse.findUnique({
        where: { id: nurseId },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              createdAt: true,
            },
          },
          schedule: true,
          assignments: {
            include: {
              doctor: true,
              tasks: {
                where: {
                  status: 'PENDING',
                },
                include: {
                  patient: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json(nurse)
  } catch (error) {
    console.error('Error updating nurse:', error)
    return NextResponse.json(
      { error: 'Failed to update nurse' },
      { status: 500 }
    )
  }
}

// POST /api/admin/nurses/:nurseId/assignments
export async function POST_ASSIGNMENT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can manage nurse assignments' },
        { status: 403 }
      )
    }

    const nurseId = req.url.split('/').slice(-2)[0]
    if (!nurseId) {
      return NextResponse.json(
        { error: 'Nurse ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { doctorId } = body

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      )
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.nurseAssignment.findFirst({
      where: {
        nurseId,
        doctorId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 400 }
      )
    }

    // Create new assignment
    const assignment = await prisma.nurseAssignment.create({
      data: {
        nurseId,
        doctorId,
      },
      include: {
        nurse: true,
        doctor: true,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating nurse assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create nurse assignment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/nurses/:nurseId/assignments/:assignmentId
export async function DELETE_ASSIGNMENT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can manage nurse assignments' },
        { status: 403 }
      )
    }

    const assignmentId = req.url.split('/').pop()
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    // Delete assignment
    await prisma.nurseAssignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting nurse assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete nurse assignment' },
      { status: 500 }
    )
  }
}