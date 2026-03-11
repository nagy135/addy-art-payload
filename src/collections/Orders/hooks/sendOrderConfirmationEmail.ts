import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'
import * as Sentry from '@sentry/nextjs'

import type { Order } from '@/payload-types'

const getRecipientEmail = (order: Order) => {
  if (typeof order.customerEmail === 'string' && order.customerEmail) {
    return order.customerEmail
  }

  if (typeof order.shippingAddress?.email === 'string' && order.shippingAddress.email) {
    return order.shippingAddress.email
  }

  return null
}

const getProductName = async ({
  product,
  req,
}: {
  product: string | { title?: string | null } | null | undefined
  req: PayloadRequest
}) => {
  if (!product) {
    return null
  }

  if (typeof product === 'object' && 'title' in product && typeof product.title === 'string') {
    return product.title
  }

  if (typeof product !== 'string') {
    return null
  }

  try {
    const foundProduct = await req.payload.findByID({
      collection: 'products',
      depth: 0,
      id: product,
      req,
    })

    return typeof foundProduct?.title === 'string' ? foundProduct.title : null
  } catch {
    return null
  }
}

export const sendOrderConfirmationEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') {
    return doc
  }

  const order = doc as Order
  const recipientEmail = getRecipientEmail(order)

  if (!recipientEmail) {
    req.payload.logger.warn({
      msg: 'Skipping order confirmation email because no recipient email was found.',
      orderID: order.id,
    })

    return doc
  }

  const productNames = (
    await Promise.all(
      (order.items || []).map(async (item) => {
        const productName = await getProductName({
          product: item.product,
          req,
        })

        return productName || 'Unknown item'
      }),
    )
  ).filter(Boolean)

  const text = productNames.length
    ? `you ordered item with name: ${productNames.join(', ')}`
    : 'you ordered item with name: Unknown item'

  try {
    await req.payload.sendEmail({
      subject: `Order confirmation #${order.id}`,
      text,
      to: recipientEmail,
    })

    Sentry.captureMessage('Order confirmation email sent', {
      level: 'info',
      tags: {
        feature: 'email',
        type: 'order-confirmation',
      },
      extra: {
        orderID: order.id,
        recipientEmail,
        text,
      },
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: 'email',
        type: 'order-confirmation',
      },
      extra: {
        orderID: order.id,
        recipientEmail,
        text,
      },
    })

    req.payload.logger.error({
      err: error,
      msg: 'Failed to send order confirmation email.',
      orderID: order.id,
    })
  }

  return doc
}
