import { useEffect, useMemo, useRef } from 'react'
import { DemoShell } from '../DemoShell'
import { legacyModules } from './modules'
import type { LegacyConfig, LegacyStep } from './runtime'
import './legacy.css'

/** 舞台：把每一步交给旧版 render 函数做命令式 DOM 渲染 */
function LegacyStage({
  config,
  step,
  index,
}: {
  config: LegacyConfig
  step: LegacyStep
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = ref.current
    if (!stage || typeof config.render !== 'function') return
    stage.innerHTML = ''
    config.render(step, index, { stage })
  }, [config, step, index])

  return <div ref={ref} className="demo-legacy-stage" />
}

/** 迁移版演示：旧步骤数据 + 旧舞台渲染 + 新外壳 */
export default function LegacyDemo({ config }: { config: LegacyConfig }) {
  const steps = useMemo(() => config.steps ?? [], [config])
  return (
    <DemoShell
      title={config.title}
      info={config.info as never}
      steps={steps}
      html
      stageMinHeight={config.stageHeight}
      autoMs={config.autoMs}
      legend={config.legend}
      renderStep={(s, i) => <LegacyStage config={config} step={s} index={i} />}
      describe={(s, i) =>
        typeof config.desc === 'function' ? config.desc(s, i) : config.desc ?? s.note ?? ''
      }
    />
  )
}

export { legacyModules }
