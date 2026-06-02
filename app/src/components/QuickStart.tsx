import { Link } from 'react-router-dom'
import { HardDrive, Wifi, Zap, ArrowRight } from 'lucide-react'
import { Button } from './ui'

export default function QuickStart() {
  const steps = [
    { icon: HardDrive, title: 'Connect a Device', desc: 'Plug in your SD card or configure WiFi' },
    { icon: Wifi, title: 'Auto-Sync', desc: 'Clips sync automatically to your phone' },
    { icon: Zap, title: 'Manage & Analyze', desc: 'Organize clips and view analytics' },
  ]

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-8 mb-8">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Get Started with CardBridge
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Set up your first device in 3 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm">
                  <Icon size={20} className="text-slate-700 dark:text-slate-300" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h3>
                  {i === 0 && <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium text-slate-700 dark:text-slate-300">Start here</span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link to="/devices/add">
          <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white">
            Add Your First Device
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
