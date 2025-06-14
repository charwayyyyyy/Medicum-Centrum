import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { WebSocket } from 'ws'

// Store WebSocket connections for each nurse
const nurseConnections = new Map<string, WebSocket>()

// GET /api/nurse-assignments
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'NURSE') {
      return NextResponse.json(
        { error: 'Only nurses can access assignments' },
        { status: 403 }
      )
    }

    // Get nurse's ID
    const nurse = await prisma.nurse.findFirst({
      where: { userId: session.user.id },
    })

    if (!nurse) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    // Get nurse's assignments and tasks
    const assignments = await prisma.nurseAssignment.findMany({
      where: { nurseId: nurse.id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        tasks: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true,
              },
            },
          },
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching nurse assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST /api/nurse-assignments
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can create nurse assignments' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { nurseId, patientId, title, description, priority } = body

    // Validate input
    if (!nurseId || !patientId || !title || !description || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get doctor's ID
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      )
    }

    // Check if nurse is assigned to the doctor
    const assignment = await prisma.nurseAssignment.findFirst({
      where: {
        nurseId,
        doctorId: doctor.id,
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Nurse is not assigned to you' },
        { status: 403 }
      )
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        patientId,
        doctorId: doctor.id,
        nurseAssignmentId: assignment.id,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Send real-time notification to nurse
    const nurseWs = nurseConnections.get(nurseId)
    if (nurseWs && nurseWs.readyState === WebSocket.OPEN) {
      nurseWs.send(
        JSON.stringify({
          type: 'NEW_TASK',
          message: `New task assigned by Dr. ${doctor.firstName} ${doctor.lastName}: ${title}`,
          task,
        })
      )
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating nurse assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

// PATCH /api/nurse-assignments/:taskId
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'NURSE') {
      return NextResponse.json(
        { error: 'Only nurses can update task status' },
        { status: 403 }
      )
    }

    const taskId = req.url.split('/').pop()
    const body = await req.json()
    const { status } = body

    if (!taskId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get nurse's ID
    const nurse = await prisma.nurse.findFirst({
      where: { userId: session.user.id },
    })

    if (!nurse) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    // Update task status
    const task = await prisma.task.update({
      where: {
        id: taskId,
        nurseAssignment: {
          nurseId: nurse.id,
        },
      },
      data: { status },
      include: {
        patient: true,
        doctor: true,
      },
    })

    // Send real-time notification to doctor
    const doctorWs = nurseConnections.get(task.doctorId)
    if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
      doctorWs.send(
        JSON.stringify({
          type: 'TASK_COMPLETED',
          message: `Task "${task.title}" for patient ${task.patient.firstName} ${task.patient.lastName} has been completed`,
          task,
        })
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}