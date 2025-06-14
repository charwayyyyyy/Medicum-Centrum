import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { parse } from 'url'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface AuthenticatedSocket extends WebSocket {
  userId?: string
  role?: string
}

const wsServer = new WebSocketServer({ noServer: true })

// Store active connections
const connections = new Map<string, AuthenticatedSocket>()

// Handle WebSocket connection
wsServer.on('connection', async (ws: AuthenticatedSocket, userId: string, role: string) => {
  // Store the connection with user info
  ws.userId = userId
  ws.role = role
  connections.set(userId, ws)

  console.log(`User ${userId} (${role}) connected`)

  // Handle client messages
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message)
      
      switch (data.type) {
        case 'TASK_UPDATE':
          // Handle task updates
          if (ws.role === 'NURSE') {
            const task = await prisma.task.findUnique({
              where: { id: data.taskId },
              include: {
                doctor: true,
                patient: true,
              },
            })

            if (task) {
              // Notify the doctor
              const doctorWs = connections.get(task.doctor.userId)
              if (doctorWs?.readyState === WebSocket.OPEN) {
                doctorWs.send(JSON.stringify({
                  type: 'TASK_STATUS_UPDATE',
                  task: {
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    patient: {
                      firstName: task.patient.firstName,
                      lastName: task.patient.lastName,
                    },
                  },
                }))
              }
            }
          }
          break

        case 'PATIENT_TRANSFER':
          // Handle patient transfer notifications
          if (ws.role === 'NURSE' || ws.role === 'DOCTOR') {
            const { fromNurseId, toNurseId, patientId } = data
            
            const patient = await prisma.patient.findUnique({
              where: { id: patientId },
              select: {
                firstName: true,
                lastName: true,
              },
            })

            if (patient) {
              // Notify the receiving nurse
              const toNurse = await prisma.nurse.findUnique({
                where: { id: toNurseId },
                select: { userId: true },
              })

              if (toNurse) {
                const nurseWs = connections.get(toNurse.userId)
                if (nurseWs?.readyState === WebSocket.OPEN) {
                  nurseWs.send(JSON.stringify({
                    type: 'PATIENT_ASSIGNED',
                    message: `Patient ${patient.firstName} ${patient.lastName} has been assigned to you`,
                    patient,
                  }))
                }
              }
            }
          }
          break

        case 'APPOINTMENT_UPDATE':
          // Handle appointment updates
          if (ws.role === 'ADMIN' || ws.role === 'DOCTOR') {
            const { appointmentId, status, patientId } = data
            
            const patient = await prisma.patient.findUnique({
              where: { id: patientId },
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            })

            if (patient) {
              // Notify the patient
              const patientWs = connections.get(patient.userId)
              if (patientWs?.readyState === WebSocket.OPEN) {
                patientWs.send(JSON.stringify({
                  type: 'APPOINTMENT_STATUS_UPDATE',
                  appointmentId,
                  status,
                  message: `Your appointment status has been updated to ${status}`,
                }))
              }
            }
          }
          break

        case 'VITAL_SIGNS_ALERT':
          // Handle vital signs alerts
          if (ws.role === 'NURSE') {
            const { patientId, vitalSign, threshold } = data
            
            // Find the patient's doctor
            const patient = await prisma.patient.findUnique({
              where: { id: patientId },
              include: {
                appointments: {
                  where: { status: 'SCHEDULED' },
                  include: { doctor: true },
                },
              },
            })

            if (patient?.appointments[0]?.doctor) {
              const doctor = patient.appointments[0].doctor
              const doctorWs = connections.get(doctor.userId)
              
              if (doctorWs?.readyState === WebSocket.OPEN) {
                doctorWs.send(JSON.stringify({
                  type: 'VITAL_SIGNS_ALERT',
                  patient: {
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                  },
                  vitalSign,
                  threshold,
                  message: `Alert: Patient ${patient.firstName} ${patient.lastName}'s ${vitalSign} is outside normal range`,
                }))
              }
            }
          }
          break
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error)
    }
  })

  // Handle client disconnection
  ws.on('close', () => {
    connections.delete(userId)
    console.log(`User ${userId} disconnected`)
  })
})

// Authenticate WebSocket upgrade requests
export function handleUpgrade(server: any) {
  server.on('upgrade', async (request: any, socket: any, head: any) => {
    const { pathname, query } = parse(request.url, true)

    if (pathname === '/ws') {
      try {
        // Get token from query parameter
        const token = query.token as string
        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
          socket.destroy()
          return
        }

        // Verify JWT token
        const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as any
        if (!decoded?.sub || !decoded?.role) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
          socket.destroy()
          return
        }

        // Authenticate and establish WebSocket connection
        wsServer.handleUpgrade(request, socket, head, (ws) => {
          wsServer.emit('connection', ws, decoded.sub, decoded.role)
        })
      } catch (error) {
        console.error('WebSocket upgrade error:', error)
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
      }
    }
  })
}

// Export the connections map for use in API routes
export { connections }