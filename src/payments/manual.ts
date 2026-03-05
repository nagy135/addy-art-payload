import type { GroupField } from 'payload'

const methodName = 'manual'

type AdapterArgs = {
  label?: string
}

export const manualAdapter = ({ label }: AdapterArgs = {}) => {
  const group: GroupField = {
    name: methodName,
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === methodName,
    },
    fields: [],
  }

  return {
    name: methodName,
    label: label || 'Pay later',
    group,
    initiatePayment: async () => {
      return {
        message: 'No payment required to place this order.',
      }
    },
    confirmOrder: async ({
      cartsSlug = 'carts',
      data,
      ordersSlug = 'orders',
      req,
      transactionsSlug = 'transactions',
    }: {
      cartsSlug?: string
      data: Record<string, unknown>
      ordersSlug?: string
      req: { payload: any; user?: { id: string; email?: string } | null }
      transactionsSlug?: string
    }) => {
      const payload = req.payload
      const cartID = data.cartID

      if (!cartID || typeof cartID !== 'string') {
        throw new Error('Cart ID is required to create an order.')
      }

      const cart = await payload.findByID({
        id: cartID,
        collection: cartsSlug,
        depth: 0,
        overrideAccess: false,
        req,
        select: {
          id: true,
          items: true,
          subtotal: true,
          currency: true,
        },
      })

      if (!cart?.items || cart.items.length === 0) {
        throw new Error('Cart is empty.')
      }

      const items = cart.items
        .map((item: { product?: any; variant?: any; quantity?: number }) => {
          const productID =
            typeof item.product === 'object' && item.product ? item.product.id : item.product
          const variantID =
            typeof item.variant === 'object' && item.variant ? item.variant.id : item.variant

          if (!productID || !item.quantity) {
            return null
          }

          return {
            product: productID,
            variant: variantID,
            quantity: item.quantity,
          }
        })
        .filter(Boolean)

      if (!items.length) {
        throw new Error('Cart has no valid items.')
      }

      const customerEmail =
        req.user?.email || (typeof data.customerEmail === 'string' ? data.customerEmail : '')

      if (!req.user && !customerEmail) {
        throw new Error('A customer email is required to create an order.')
      }

      const transaction = await payload.create({
        collection: transactionsSlug,
        data: {
          items,
          paymentMethod: methodName,
          status: 'pending',
          amount: cart.subtotal || 0,
          currency: cart.currency || 'USD',
          cart: cart.id,
          ...(req.user
            ? {
                customer: req.user.id,
              }
            : {
                customerEmail,
              }),
          ...(data.billingAddress
            ? {
                billingAddress: data.billingAddress,
              }
            : {}),
        },
        req,
      })

      const order = await payload.create({
        collection: ordersSlug,
        data: {
          items,
          amount: cart.subtotal || 0,
          currency: cart.currency || 'USD',
          status: 'processing',
          transactions: [transaction.id],
          ...(req.user
            ? {
                customer: req.user.id,
              }
            : {
                customerEmail,
              }),
          ...(data.shippingAddress
            ? {
                shippingAddress: data.shippingAddress,
              }
            : {}),
        },
        req,
      })

      await payload.update({
        id: transaction.id,
        collection: transactionsSlug,
        data: {
          order: order.id,
        },
        req,
      })

      await payload.update({
        id: cartID,
        collection: cartsSlug,
        data: {
          purchasedAt: new Date().toISOString(),
        },
        req,
      })

      return {
        message: 'Order created successfully',
        orderID: order.id,
        transactionID: transaction.id,
        ...(order.accessToken
          ? {
              accessToken: order.accessToken,
            }
          : {}),
      }
    },
  }
}

export const manualAdapterClient = ({ label }: AdapterArgs = {}) => {
  return {
    name: methodName,
    label: label || 'Pay later',
    initiatePayment: false,
    confirmOrder: true,
  }
}
