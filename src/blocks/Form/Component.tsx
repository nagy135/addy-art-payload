import configPromise from '@payload-config'
import { getFrontendLocale } from '@/i18n/frontend-server'
import { getPayload } from 'payload'

import { FormBlockClient, type FormBlockType } from './ClientComponent'

type Props = FormBlockType & {
  id?: string | number
}

export async function FormBlock(props: Props) {
  const locale = await getFrontendLocale()
  const payload = await getPayload({ config: configPromise })

  const formID = typeof props.form === 'object' ? props.form.id : props.form

  const form = await payload.findByID({
    collection: 'forms',
    id: String(formID),
    depth: 1,
    locale: locale as never,
  })

  return (
    <FormBlockClient
      {...props}
      form={form as Props['form']}
      id={props.id !== undefined ? String(props.id) : undefined}
    />
  )
}
