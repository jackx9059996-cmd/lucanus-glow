import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'

const rules = {
  WD: 'WD 用於野外採集個體，保留採集資訊與基本尺寸紀錄。',
  WF: 'WF 可自行填寫代數，成蟲與幼蟲可分開建立，幼蟲也可保留父母尺寸。',
  CBF: 'CBF 可自行填寫代數，成蟲與幼蟲可分開建立，幼蟲也可保留父母尺寸。',
}

const defaultForm = (data) => ({
  categoryId: data[0]?.categoryId || '',
  lineageId: '',
  scientificName: '',
  commonName: '',
  lineageName: '',
  prefix: 'WD',
  generation: '',
  stage: 'adult',
  instar: 'L1',
  gender: 'male',
  size: '',
  fatherSize: '',
  motherSize: '',
  locality: '',
  collectionDate: '',
  note: '',
})

export default function CreateRecordForm({ data, onClose, onCreate }) {
  const [speciesMode, setSpeciesMode] = useState(data.length ? 'existing' : 'new')
  const [lineageMode, setLineageMode] = useState('new')
  const [form, setForm] = useState(() => defaultForm(data))

  const category = useMemo(
    () => data.find((item) => item.categoryId === form.categoryId),
    [data, form.categoryId],
  )

  const isStageChoice = form.prefix === 'WF' || form.prefix === 'CBF'
  const isLarva = isStageChoice && form.stage === 'larva'
  const showParentSizes = form.prefix !== 'WD' && (!isStageChoice || isLarva || form.stage === 'adult')
  const code = form.prefix === 'WD' ? 'WD' : `${form.prefix}${form.generation || ''}`

  const selectedLineage =
    lineageMode === 'existing'
      ? category?.lineages.find((item) => item.lineageId === form.lineageId)
      : null

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((current) => {
      const next = { ...current, [field]: value }

      if (field === 'categoryId') {
        next.lineageId = ''
        next.lineageName = ''
      }

      if (field === 'prefix' && value === 'WD') {
        next.generation = ''
        next.stage = 'adult'
        next.instar = 'L1'
      }

      if (field === 'stage' && value === 'adult') {
        next.instar = 'L1'
      }

      return next
    })
  }

  const submit = (event) => {
    event.preventDefault()

    const targetLineageName =
      lineageMode === 'existing' ? selectedLineage?.lineageName : form.lineageName.trim()

    if (speciesMode === 'new' && (!form.scientificName.trim() || !form.commonName.trim())) return
    if (!targetLineageName) return

    const id = Date.now()
    const metricUnit = isLarva ? 'g' : 'mm'
    const displayName = isLarva
      ? `${targetLineageName} ${form.instar}`
      : `${targetLineageName} ${form.gender === 'male' ? '公蟲' : '母蟲'}`

    const record = {
      id: `beetle_${id}`,
      name: displayName,
      gender: isLarva ? 'larva' : form.gender,
      size: form.size ? `${form.size}${metricUnit}` : '—',
      attributes: {
        stage: isLarva ? '幼蟲' : '成蟲',
        instar: isLarva ? form.instar : undefined,
        locality: form.prefix === 'WD' ? form.locality || undefined : undefined,
        collectionDate: form.prefix === 'WD' ? form.collectionDate || undefined : undefined,
        fatherSize: showParentSizes ? form.fatherSize || undefined : undefined,
        motherSize: showParentSizes ? form.motherSize || undefined : undefined,
        note: form.note || undefined,
      },
      feedingRecords: [],
      children: [],
    }

    if (speciesMode === 'new') {
      onCreate({
        categoryId: `category_${id}`,
        scientificName: form.scientificName.trim(),
        commonName: form.commonName.trim(),
        lineages: [
          {
            lineageId: `lineage_${id}`,
            lineageName: targetLineageName,
            generationCode: code,
            familyTree: record,
          },
        ],
      })
      onClose()
      return
    }

    if (lineageMode === 'existing' && form.lineageId) {
      onCreate({
        categoryId: form.categoryId,
        lineageId: form.lineageId,
        record,
      })
      onClose()
      return
    }

    onCreate({
      categoryId: form.categoryId,
      lineage: {
        lineageId: `lineage_${id}`,
        lineageName: targetLineageName,
        generationCode: code,
        familyTree: record,
      },
    })
    onClose()
  }

  return (
    <div className="modal-backdrop">
      <form className="record-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">新增蟲種紀錄</span>
            <h2>建立血統與個體資料</h2>
          </div>
          <button type="button" className="plain-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <section className="form-section">
          <h3>物種</h3>
          <div className="mode-switch">
            <button
              type="button"
              className={speciesMode === 'existing' ? 'active' : ''}
              onClick={() => setSpeciesMode('existing')}
            >
              選擇已建立物種
            </button>
            <button
              type="button"
              className={speciesMode === 'new' ? 'active' : ''}
              onClick={() => setSpeciesMode('new')}
            >
              新增物種
            </button>
          </div>

          {speciesMode === 'existing' ? (
            <label>
              已建立物種
              <select value={form.categoryId} onChange={updateField('categoryId')}>
                {data.map((item) => (
                  <option key={item.categoryId} value={item.categoryId}>
                    {item.scientificName} ｜ {item.commonName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="form-grid compact-grid">
              <label>
                學名簡稱
                <input required value={form.scientificName} onChange={updateField('scientificName')} />
              </label>
              <label>
                中文俗名
                <input required value={form.commonName} onChange={updateField('commonName')} />
              </label>
            </div>
          )}
        </section>

        <section className="form-section">
          <h3>血統</h3>

          {speciesMode === 'existing' && (
            <div className="mode-switch">
              <button
                type="button"
                className={lineageMode === 'existing' ? 'active' : ''}
                onClick={() => setLineageMode('existing')}
              >
                選擇已建立血統
              </button>
              <button
                type="button"
                className={lineageMode === 'new' ? 'active' : ''}
                onClick={() => setLineageMode('new')}
              >
                新增血統
              </button>
            </div>
          )}

          {lineageMode === 'existing' && category?.lineages.length ? (
            <label>
              已建立血統
              <select value={form.lineageId} onChange={updateField('lineageId')}>
                <option value="">請選擇血統</option>
                {category.lineages.map((item) => (
                  <option key={item.lineageId} value={item.lineageId}>
                    {item.lineageName} ｜ {item.generationCode || '未標示'}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              血統名稱
              <input required value={form.lineageName} onChange={updateField('lineageName')} />
            </label>
          )}

          <div className="generation-fields">
            <label>
              代號
              <select value={form.prefix} onChange={updateField('prefix')}>
                <option value="WD">WD</option>
                <option value="WF">WF</option>
                <option value="CBF">CBF</option>
              </select>
            </label>
            <label>
              代數
              <input
                disabled={form.prefix === 'WD'}
                inputMode="numeric"
                value={form.generation}
                onChange={updateField('generation')}
              />
            </label>
          </div>

          <p className="generation-rule">{rules[form.prefix]}</p>
        </section>

        <section className="form-section">
          <h3>個體資料</h3>

          {isStageChoice && (
            <label>
              紀錄階段
              <select value={form.stage} onChange={updateField('stage')}>
                <option value="adult">成蟲</option>
                <option value="larva">幼蟲</option>
              </select>
            </label>
          )}

          <div className="form-grid">
            {isLarva ? (
              <>
                <label>
                  齡數
                  <select value={form.instar} onChange={updateField('instar')}>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                  </select>
                </label>
                <label>
                  重量（g）
                  <input inputMode="decimal" value={form.size} onChange={updateField('size')} />
                </label>
              </>
            ) : (
              <>
                <label>
                  公蟲／母蟲
                  <select value={form.gender} onChange={updateField('gender')}>
                    <option value="male">公蟲</option>
                    <option value="female">母蟲</option>
                  </select>
                </label>
                <label>
                  尺寸（mm）
                  <input inputMode="decimal" value={form.size} onChange={updateField('size')} />
                </label>
              </>
            )}

            {showParentSizes && (
              <>
                <label>
                  父代尺寸（mm）
                  <input inputMode="decimal" value={form.fatherSize} onChange={updateField('fatherSize')} />
                </label>
                <label>
                  母代尺寸（mm）
                  <input inputMode="decimal" value={form.motherSize} onChange={updateField('motherSize')} />
                </label>
              </>
            )}

            {form.prefix === 'WD' && (
              <>
                <label>
                  採集產地
                  <input value={form.locality} onChange={updateField('locality')} />
                </label>
                <label>
                  採集日
                  <input type="date" value={form.collectionDate} onChange={updateField('collectionDate')} />
                </label>
              </>
            )}

            <label className="full">
              備註
              <textarea value={form.note} onChange={updateField('note')} />
            </label>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button className="create-button" type="submit">
            <Plus size={17} /> 建立紀錄
          </button>
        </div>
      </form>
    </div>
  )
}
