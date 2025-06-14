import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/doctors
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access doctor management' },
        { status: 403 }
      )
    }

    // Get all doctors with their schedules and appointments
    const doctors = await prisma.doctor.findMany({
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
        appointments: {
          where: {
            date: {
              gte: new Date(),
            },
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
            date: 'asc',
          },
        },
        nurseAssignments: {
          include: {
            nurse: {
              select: {
                firstName: true,
                lastName: true,
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

    return NextResponse.json(doctors)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
}

// POST /api/admin/doctors
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create doctors' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, firstName, lastName, specialization } = body

    // Validate input
    if (!email || !firstName || !lastName || !specialization) {
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

    // Create user and doctor profile
    const doctor = await prisma.user.create({
      data: {
        email,
        role: 'DOCTOR',
        doctor: {
          create: {
            firstName,
            lastName,
            specialization,
          },
        },
      },
      include: {
        doctor: true,
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error('Error creating doctor:', error)
    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/doctors/:doctorId
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update doctors' },
        { status: 403 }
      )
    }

    const doctorId = req.url.split('/').pop()
    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { firstName, lastName, specialization } = body

    // Update doctor profile
    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        firstName,
        lastName,
        specialization,
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            createdAt: true,
          },
        },
        schedule: true,
        appointments: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          include: {
            patient: true,
          },
        },
      },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error('Error updating doctor:', error)
    return NextResponse.json(
      { error: 'Failed to update doctor' },
      { status: 500 }
    )
  }
}