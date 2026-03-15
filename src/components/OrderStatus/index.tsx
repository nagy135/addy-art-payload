import { OrderStatus as StatusOptions } from '@/payload-types'
import { getServerTranslation } from '@/i18n/frontend-server'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus = async ({ status, className }: Props) => {
  const { t } = await getServerTranslation()

  if (!status) {
    return null
  }

  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-0 px-2 rounded w-fit',
        className,
        {
          'bg-primary/10': status === 'processing',
          'bg-success': status === 'completed',
        },
      )}
    >
      {t(`status.${status}`)}
    </div>
  )
}
