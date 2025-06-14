import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

// Schema for billing validation
const billingSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      quantity: z.number().positive('Quantity must be positive'),
      unitPrice: z.number().positive('Unit price must be positive'),
    })
  ),
})

// GET /api/admin/billing
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access billing' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query filters
    const where: any = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get invoices with related data
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            date: true,
            type: true,
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
              },
            },
          },
        },
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/admin/billing
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create invoices' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = billingSchema.parse(body)

    // Calculate total amount from items
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        patientId: validatedData.patientId,
        appointmentId: validatedData.appointmentId,
        amount: totalAmount,
        description: validatedData.description,
        dueDate: new Date(validatedData.dueDate),
        status: 'PENDING',
        items: {
          create: validatedData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        patient: true,
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/billing/:invoiceId
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update invoices' },
        { status: 403 }
      )
    }

    const invoiceId = req.url.split('/').pop()
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { status, paymentAmount, paymentMethod } = body

    // Update invoice status and create payment if provided
    const invoice = await prisma.$transaction(async (prisma) => {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status,
          ...(paymentAmount && paymentMethod
            ? {
                payments: {
                  create: {
                    amount: paymentAmount,
                    method: paymentMethod,
                  },
                },
              }
            : {}),
        },
        include: {
          patient: true,
          items: true,
          payments: true,
        },
      })

      // Check if invoice is fully paid
      if (updatedInvoice.payments) {
        const totalPaid = updatedInvoice.payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        )
        if (totalPaid >= updatedInvoice.amount) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID' },
          })
        }
      }

      return updatedInvoice
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// POST /api/admin/billing/:invoiceId/payments
export async function POST_PAYMENT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can process payments' },
        { status: 403 }
      )
    }

    const invoiceId = req.url.split('/').slice(-2)[0]
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { amount, method } = body

    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Payment amount and method are required' },
        { status: 400 }
      )
    }

    // Create payment and update invoice status
    const payment = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      const newPayment = await prisma.payment.create({
        data: {
          invoiceId,
          amount,
          method,
        },
      })

      const totalPaid =
        invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount

      if (totalPaid >= invoice.amount) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' },
        })
      } else if (totalPaid > 0) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PARTIALLY_PAID' },
        })
      }

      return newPayment
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}