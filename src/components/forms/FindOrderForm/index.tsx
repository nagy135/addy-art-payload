'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useTranslation } from '@/providers/FrontendI18n'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { sendOrderAccessEmail } from './sendOrderAccessEmail'

type FormData = {
  email: string
  orderID: string
}

type Props = {
  initialEmail?: string
}

export const FindOrderForm: React.FC<Props> = ({ initialEmail }) => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {
      email: initialEmail || user?.email,
    },
  })

  const onSubmit = useCallback(
    async (data: FormData) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const result = await sendOrderAccessEmail({
          email: data.email,
          orderID: data.orderID,
        })

        if (result.success) {
          setSuccess(true)
        } else {
          setSubmitError(result.error || t('errors.somethingWentWrong'))
        }
      } catch {
        setSubmitError(t('errors.somethingWentWrong'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [t],
  )

  if (success) {
    return (
      <Fragment>
        <h1 className="text-xl mb-4">{t('orders.checkYourEmail')}</h1>
        <div className="prose dark:prose-invert">
          <p>{t('orders.sendAccessEmailSuccess')}</p>
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <h1 className="text-xl mb-4">{t('orders.findOrder')}</h1>
      <div className="prose dark:prose-invert mb-8">
        <p>{t('orders.findOrderHelp')}</p>
      </div>
      <form className="max-w-lg flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="email" className="mb-2">
            {t('auth.emailAddress')}
          </Label>
          <Input
            id="email"
            {...register('email', { required: t('auth.emailRequired') })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="orderID" className="mb-2">
            {t('orders.orderId')}
          </Label>
          <Input
            id="orderID"
            {...register('orderID', {
              required: t('orders.orderIdRequired'),
            })}
            type="text"
          />
          {errors.orderID && <FormError message={errors.orderID.message} />}
        </FormItem>
        {submitError && <FormError message={submitError} />}
        <Button type="submit" className="self-start" variant="default" disabled={isSubmitting}>
          {isSubmitting ? t('orders.sending') : t('orders.findOrder')}
        </Button>
      </form>
    </Fragment>
  )
}
