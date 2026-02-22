import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'

interface Props {
  title: string
  meaning: string
  whereToFind: string
  example: string
}

export function InfoDrawer({ title, meaning, whereToFind, example }: Props) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  return (
    <span className="inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold leading-none shrink-0"
        aria-label={t('info_drawer.more_info')}
        aria-expanded={open}
      >
        ⓘ
      </button>

      {open && (
        <div className="mt-2 p-3 bg-sky-50 rounded-xl text-sm space-y-2.5 border border-sky-100">
          <p className="font-semibold text-sky-900">{title}</p>
          <p className="text-sky-800 leading-relaxed">{meaning}</p>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
              {t('info_drawer.where_to_find')}
            </p>
            <p className="text-sky-700">{whereToFind}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
              {t('info_drawer.example')}
            </p>
            <p className="text-sky-700 italic">"{example}"</p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-sky-500 underline"
          >
            {t('info_drawer.close')}
          </button>
        </div>
      )}
    </span>
  )
}
