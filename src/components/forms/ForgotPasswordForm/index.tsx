'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/providers/FrontendI18n'
import Link from 'next/link'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
}

export const ForgotPasswordForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { t } = useTranslation()

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
        {
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )

      if (response.ok) {
        setSuccess(true)
        setError('')
      } else {
        setError(t('auth.requestResetError'))
      }
    },
    [t],
  )

  return (
    <Fragment>
      {!success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">{t('auth.forgotPassword')}</h1>
          <div className="prose dark:prose-invert mb-8">
            <p>
              {`${t('auth.forgotPasswordHelp')} `}
              <Link href="/admin/collections/users">{t('auth.loginToAdmin')}</Link>.
            </p>
          </div>
          <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
            <Message className="mb-8" error={error} />

            <FormItem className="mb-8">
              <Label htmlFor="email" className="mb-2">
                {t('auth.emailAddress')}
              </Label>
              <Input
                id="email"
                {...register('email', { required: t('auth.provideEmail') })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <Button type="submit" variant="default">
              {t('auth.forgotPasswordSubmit')}
            </Button>
          </form>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">{t('auth.forgotPasswordSuccess')}</h1>
          <div className="prose dark:prose-invert">
            <p>{t('auth.forgotPasswordSuccessDescription')}</p>
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
