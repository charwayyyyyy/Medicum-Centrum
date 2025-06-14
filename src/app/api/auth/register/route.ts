import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schema for user registration validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  role: z.enum(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12)

    // Create user and associated role-specific profile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    })

    // Create role-specific profile
    switch (data.role) {
      case 'PATIENT':
        if (!data.dateOfBirth || !data.gender || !data.address) {
          throw new Error('Missing required patient information')
        }
        await prisma.patient.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: new Date(data.dateOfBirth),
            gender: data.gender,
            phone: data.phone,
            address: data.address,
            userId: user.id,
          },
        })
        break

      case 'DOCTOR':
        if (!data.specialization) {
          throw new Error('Specialization is required for doctors')
        }
        await prisma.doctor.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            specialization: data.specialization,
            phone: data.phone,
            userId: user.id,
          },
        })
        break

      case 'NURSE':
        await prisma.nurse.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            userId: user.id,
          },
        })
        break

      case 'ADMIN':
        await prisma.admin.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            userId: user.id,
          },
        })
        break

      default:
        throw new Error('Invalid role')
    }

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}