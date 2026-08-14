import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const oppositeGender = (gender) => (gender === 'female' ? 'male' : 'female')

export default function RelationForm({ target, onClose, onCreate }) {
  const [form, setForm] = useState(() => ({
    relationType: 'partner',
    coParentId: target.familyContext?.coParents?.[0]?.id || '',
    name: '',
    gender: oppositeGender(target.gender),
    measurement: '',
    unit: 'mm',
    pupaDate: '',
    hatchDate: '',
    locality: '',
    note: '',
  }))

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'gender') next.unit = value === 'larva' ? 'g' : 'mm'
      if (field === 'relationType' && value === 'partner' && current.gender === 'larva') {
        next.gender = oppositeGender(target.gender)
        next.unit = 'mm'
      }
      return next
    })
  }

  const submit = (event) => {
    event.preventDefault()
    const id = Date.now()
    const role = form.relationType === 'partner'
      ? form.gender === 'male' ? '父代' : '母代'
      : '子代'

    onCreate(target.id, form.relationType, {
      id: `beetle_${id}`,
      name: form.name.trim(),
      gender: form.gender,
      size: form.measurement ? `${form.measurement}${form.unit}` : '—',
      attributes: {
        relationshipRole: role,
        pupaDate: form.pupaDate ? form.pupaDate.replaceAll('-', '/') : undefined,
        hatchDate: form.hatchDate ? form.hatchDate.replaceAll('-', '/') : undefined,
        locality: form.locality.trim() || undefined,
        note: form.note.trim() || undefined,
      },
      feedingRecords: [],
      parentIds: form.relationType === 'child'
        ? [target.id, form.coParentId].filter(Boolean)
        : undefined,
      children: [],
      partners: [],
    })
    onClose()
  }

  return (
    <div className="modal-backdrop relation-backdrop" onClick={onClose}>
      <form className="record-modal relation-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">族譜關聯</span>
            <h2>為「{target.name}」新增關聯</h2>
          </div>
          <button type="button" className="plain-icon" onClick={onClose} aria-label="關閉新增關聯">
            <X size={20} />
          </button>
        </div>

        <div className="form-grid relation-grid">
          <label className="full">
            關聯類型
            <select value={form.relationType} onChange={update('relationType')}>
              <option value="partner">父代／母代（配偶、另一親代）</option>
              <option value="child">子代</option>
            </select>
          </label>

          <label>
            個體名稱
            <input required value={form.name} onChange={update('name')} placeholder="例如：26B 公蟲" />
          </label>

          <label>
            性別／階段
            <select value={form.gender} onChange={update('gender')}>
              <option value="male">公蟲</option>
              <option value="female">母蟲</option>
              {form.relationType === 'child' && <option value="larva">幼蟲</option>}
            </select>
          </label>

          {form.relationType === 'child' && target.familyContext?.coParents?.length > 0 && (
            <label className="full">
              另一親代
              <select value={form.coParentId} onChange={update('coParentId')}>
                <option value="">暫不指定</option>
                {target.familyContext.coParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}｜{parent.gender === 'male' ? '公蟲' : '母蟲'}｜{parent.size}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            尺寸／重量
            <input inputMode="decimal" value={form.measurement} onChange={update('measurement')} />
          </label>

          <label>
            單位
            <select value={form.unit} onChange={update('unit')}>
              <option value="mm">mm</option>
              <option value="g">g</option>
            </select>
          </label>

          <label>
            化蛹
            <input type="date" value={form.pupaDate} onChange={update('pupaDate')} />
          </label>

          <label>
            羽化
            <input type="date" value={form.hatchDate} onChange={update('hatchDate')} />
          </label>

          <label className="full">
            產地
            <input value={form.locality} onChange={update('locality')} />
          </label>

          <label className="full">
            備註
            <textarea value={form.note} onChange={update('note')} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>取消</button>
          <button className="create-button" type="submit"><Plus size={16} /> 建立族譜關聯</button>
        </div>
      </form>
    </div>
  )
}
