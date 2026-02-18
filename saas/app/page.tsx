import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">AdTest</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Войти
          </Link>
          <Link
            href="/register"
            className="bg-white text-zinc-950 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            Попробовать бесплатно
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Тестируйте рекламу на AI-персонах
          <br />
          <span className="text-zinc-400">до запуска кампании</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Создайте портреты целевой аудитории, загрузите офферы — получите отчёт
          с эмоциями, возражениями и рекомендациями за минуты, не за недели.
        </p>
        <Link
          href="/register"
          className="inline-block bg-white text-zinc-950 px-8 py-4 rounded-lg text-lg font-medium hover:bg-zinc-200 transition-colors"
        >
          Попробовать бесплатно →
        </Link>
      </main>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Опишите нишу', desc: 'Укажите бизнес — AI сгенерирует реалистичные портреты вашей аудитории.' },
            { step: '2', title: 'Добавьте офферы', desc: 'Загрузите варианты рекламных текстов, которые хотите протестировать.' },
            { step: '3', title: 'Получите отчёт', desc: 'Heatmap, инсайты, стратегия — узнайте, какой оффер сработает лучше.' },
          ].map((item) => (
            <div key={item.step} className="bg-zinc-900 rounded-xl p-6">
              <div className="text-3xl font-bold text-zinc-600 mb-3">{item.step}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Тарифы</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Free', price: '0 ₽', features: ['1 проект', '4 персоны', '3 оффера', '5 тестов/мес'] },
            { name: 'Pro', price: '1 990 ₽/мес', features: ['10 проектов', '20 персон', '10 офферов', '50 тестов/мес'], highlight: true },
            { name: 'Agency', price: '9 990 ₽/мес', features: ['∞ проектов', '100 персон', '50 офферов', '500 тестов/мес'] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 ${plan.highlight ? 'bg-white text-zinc-950 ring-2 ring-white' : 'bg-zinc-900'}`}
            >
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className={`text-3xl font-bold mb-4 ${plan.highlight ? '' : 'text-zinc-300'}`}>{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className={plan.highlight ? 'text-zinc-600' : 'text-zinc-400'}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-zinc-600 py-8 border-t border-zinc-800">
        © 2026 AdTest. Тестирование рекламы через AI.
      </footer>
    </div>
  )
}
