import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Background, Controls, Handle, Position, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronDown, ChevronRight, CirclePlus, Dna, Menu, PanelLeftClose, Pencil, Plus, Trash2, X } from 'lucide-react'
import CreateRecordForm from './CreateRecordForm'
import RelationForm from './RelationForm'
import { authEmail, isSupabaseConfigured, loginAccount, sessionMaxAgeDays, supabase } from './supabaseClient'
import './styles.css'

const initialData = [
  {
    categoryId: 'lucanus_1',
    scientificName: 'L.m.t',
    commonName: '台灣深山鍬形蟲',
    lineages: [
      {
        lineageId: 'lmt_2024_A',
        lineageName: '2024-桃園巴陵產',
        generationCode: 'WF1',
        familyTree: {
          id: 'root_pair_01',
          name: '野生種親對 (WF0)',
          gender: 'pair',
          size: '♂ 72mm / ♀ 41mm',
          attributes: {
            locality: '桃園巴陵',
            hatchDate: '野生採集 (2024/05)',
          },
          feedingRecords: [
            { id: 'feed_1', date: '2024/05/15', type: '進食', note: '餵食高蛋白果凍' },
          ],
          children: [
            {
              id: 'f1_male_01',
              name: 'F1-公蟲 01',
              gender: 'male',
              size: '78mm',
              attributes: {
                hatchDate: '2025/06/10',
                status: '完品',
              },
              feedingRecords: [
                {
                  id: 'feed_2',
                  date: '2024/08/10',
                  type: '換耗材',
                  note: 'L1轉L2，更換溫控產房土，體重 5g',
                },
                {
                  id: 'feed_3',
                  date: '2024/11/20',
                  type: '換耗材',
                  note: 'L3，更換雲芝菌瓶，體重 18g',
                },
              ],
              children: [],
            },
          ],
        },
      },
    ],
  },
]

const labelForGender = {
  pair: '種親對',
  male: '公蟲',
  female: '母蟲',
  larva: '幼蟲',
}

const symbolForGender = {
  pair: 'PAIR',
  male: '♂',
  female: '♀',
  larva: 'L',
}

const detailTypeOptions = ['化蛹', '羽化', '進食', '換耗材']
const loginAtStorageKey = 'lucanus-glow-login-at'
const dashboardStorageKey = 'lucanus-glow-dashboard-v1'

const getGenerationCode = (lineage) =>
  lineage.generationCode || lineage.lineageName.match(/\b(WD|WF\d*|CBF\d*)\b/)?.[1]

const normalizeAccount = (account) => {
  const value = account.trim().toLowerCase()
  return value === loginAccount ? authEmail : ''
}

const isSessionExpired = () => {
  const loginAt = Number(localStorage.getItem(loginAtStorageKey))
  if (!loginAt) return false
  return Date.now() - loginAt > sessionMaxAgeDays * 24 * 60 * 60 * 1000
}

function LoginScreen({ onLogin }) {
  const [account, setAccount] = useState(loginAccount)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const email = normalizeAccount(account)
    if (!email) {
      setSubmitting(false)
      setError('這個帳號沒有此網站的使用權限。')
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      setSubmitting(false)
      setError('帳號或密碼不正確。')
      return
    }

    localStorage.setItem(loginAtStorageKey, String(Date.now()))
    setSubmitting(false)
    onLogin(authData.session)
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Lucanus Glow</p>
          <h1>路卡微光</h1>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            帳號
            <input value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="username" />
          </label>
          <label>
            密碼
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? '登入中' : '登入'}
          </button>
        </form>
      </section>
    </main>
  )
}

function SidebarMenu({ data, activeLineage, collapsed, onToggle, onSelect, onCreate, onEditCategory, onDeleteCategory }) {
  const [openIds, setOpenIds] = useState(() => new Set(data.map((item) => item.categoryId)))

  const toggle = (id) =>
    setOpenIds((items) => {
      const next = new Set(items)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <button className="collapse-button" onClick={onToggle} aria-label="收折選單">
          {collapsed ? <Menu size={19} /> : <PanelLeftClose size={19} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <button className="create-button" onClick={onCreate}>
            <CirclePlus size={18} /> 新增蟲種紀錄
          </button>
          <p className="nav-caption">物種與血統</p>
          <nav className="tree-nav">
            {data.map((category) => (
              <div className="nav-group" key={category.categoryId}>
                <div className="nav-parent-row">
                  <button className="nav-parent" onClick={() => toggle(category.categoryId)}>
                    <span>{openIds.has(category.categoryId) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                    <em>{category.scientificName}</em>
                    <strong>{category.commonName}</strong>
                  </button>
                  <div className="nav-manage">
                    <button type="button" title="修改物種" onClick={() => onEditCategory(category)}><Pencil size={12} /></button>
                    <button type="button" title="刪除物種" onClick={() => onDeleteCategory(category.categoryId)}><Trash2 size={12} /></button>
                  </div>
                </div>

                {openIds.has(category.categoryId) && (
                  <div className="nav-children">
                    {category.lineages.map((lineage) => (
                      <button
                        key={lineage.lineageId}
                        className={`nav-child ${activeLineage?.lineageId === lineage.lineageId ? 'active' : ''}`}
                        onClick={() => onSelect(category, lineage)}
                      >
                        <span>{lineage.lineageName}</span>
                        {getGenerationCode(lineage) && <b>{getGenerationCode(lineage)}</b>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </>
      )}
    </aside>
  )
}

const BeetleNode = memo(({ data }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
  <div className={`beetle-node ${data.gender}`} role="button" tabIndex={0} onClick={() => setMenuOpen(true)} onContextMenu={(event) => { event.preventDefault(); setMenuOpen(true) }}>
    <Handle type="target" position={Position.Top} />
    {menuOpen && (
      <div className="node-action-menu" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => { setMenuOpen(false); data.onSelect(data) }}><Pencil size={13} /> 修改</button>
        <button type="button" onClick={() => { setMenuOpen(false); data.onDelete(data.id) }}><Trash2 size={13} /> 刪除</button>
        <button type="button" onClick={() => { setMenuOpen(false); data.onAddRelation(data) }}><Plus size={13} /> 新增關聯</button>
      </div>
    )}
    <div className="node-top">
      <span>{labelForGender[data.gender]}</span>
      <b>{data.size}</b>
    </div>
    <h3>{data.name}</h3>
    <div className="node-meta">
      {data.attributes.relationshipRole && <span>關聯：{data.attributes.relationshipRole}</span>}
      <span>羽化：{data.attributes.hatchDate || '未填寫'}</span>
      {data.attributes.pupaDate && <span>化蛹：{data.attributes.pupaDate}</span>}
      {data.attributes.status && <span>狀態：{data.attributes.status}</span>}
      {data.attributes.locality && <span>產地：{data.attributes.locality}</span>}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
  )
})

const nodeTypes = { beetle: BeetleNode }

function toFlow(tree, onSelect, onDelete, onAddRelation) {
  const levels = []
  const edges = []
  const contexts = new Map()

  const summary = (item) => ({ id: item.id, name: item.name, gender: item.gender, size: item.size })

  const walk = (item, depth = 0) => {
    ;(levels[depth] ||= []).push(item)
    const partners = item.partners || []
    levels[depth].push(...partners)

    contexts.set(item.id, { coParents: partners.map(summary) })
    partners.forEach((partner) => contexts.set(partner.id, { coParents: [summary(item)] }))

    item.children?.forEach((child) => {
      const parentIds = child.parentIds?.length
        ? child.parentIds
        : [item.id, partners[0]?.id].filter(Boolean)

      parentIds.forEach((parentId) => {
        edges.push({
          id: `${parentId}-${child.id}`,
          source: parentId,
          target: child.id,
          type: 'smoothstep',
        })
      })
      walk(child, depth + 1)
    })
  }

  walk(tree)

  return {
    nodes: levels.flatMap((items, depth) =>
      items.map((item, index) => ({
        id: item.id,
        type: 'beetle',
        position: { x: index * 280 + (depth === 0 ? 180 : 0), y: depth * 255 },
        data: { ...item, familyContext: contexts.get(item.id), onSelect, onDelete, onAddRelation },
      })),
    ),
    edges,
  }
}

function FamilyTree({ lineage, onNodeSelect, onDeleteNode, onAddRelation }) {
  const flow = useMemo(
    () => toFlow(lineage.familyTree, onNodeSelect, onDeleteNode, onAddRelation),
    [lineage, onNodeSelect, onDeleteNode, onAddRelation],
  )
  const onInit = useCallback((instance) => requestAnimationFrame(() => instance.fitView({ padding: 0.28 })), [])

  return (
    <section className="content-tree">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        minZoom={0.35}
        maxZoom={1.7}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8e7bd" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  )
}

function BeetleDetailDrawer({ beetle, onClose, onAddRecord, onUpdateRecord, onDeleteRecord, onUpdateBeetle, onUpdateSize }) {
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [sizeDraft, setSizeDraft] = useState('')
  const [record, setRecord] = useState({
    date: new Date().toISOString().slice(0, 10).replaceAll('-', '/'),
    type: '進食',
    note: '',
  })

  useEffect(() => {
    if (beetle) {
      setShowRecordForm(false)
      setEditingId(null)
      setSizeDraft(beetle.size === '—' ? '' : beetle.size)
      setRecord({
        date: new Date().toISOString().slice(0, 10).replaceAll('-', '/'),
        type: '進食',
        note: '',
      })
    }
  }, [beetle])

  if (!beetle) return null

  const submit = (event) => {
    event.preventDefault()
    if (!record.note.trim()) return
    const payload = { ...record, id: editingId || `feed_${Date.now()}` }
    if (editingId) onUpdateRecord(beetle.id, payload)
    else onAddRecord(beetle.id, payload)
    setRecord((current) => ({ ...current, note: '' }))
    setShowRecordForm(false)
    setEditingId(null)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setRecord({ date: item.date, type: item.type, note: item.note })
    setShowRecordForm(true)
  }

  const updateDate = (field, value) => onUpdateBeetle(beetle.id, { [field]: value.replaceAll('-', '/') })
  const commitSize = () => {
    const value = sizeDraft.trim()
    if (!value) {
      setSizeDraft(beetle.size === '—' ? '' : beetle.size)
      return
    }
    if (value !== beetle.size) onUpdateSize(beetle.id, value)
  }

  return (
    <aside className="detail-drawer">
      <div className="drawer-header">
        <div className="drawer-title">
          <span className="eyebrow">個體飼育紀錄</span>
          <h2>{beetle.name}</h2>
          <div className="drawer-dates">
            <div className="drawer-date-item">
              <span>化蛹</span>
              <input type="date" value={(beetle.attributes.pupaDate || '').replaceAll('/', '-')} onChange={(event) => updateDate('pupaDate', event.target.value)} aria-label="化蛹日期" />
            </div>
            <div className="drawer-date-item">
              <span>羽化</span>
              <input type="date" value={(beetle.attributes.hatchDate || '').replaceAll('/', '-')} onChange={(event) => updateDate('hatchDate', event.target.value)} aria-label="羽化日期" />
            </div>
          </div>
        </div>

        <div className="drawer-topside">
          <div className="drawer-quick-meta">
            <div className="quick-meta-item">
              <b>{symbolForGender[beetle.gender]}</b>
              <input
                className="quick-size-input"
                value={sizeDraft}
                size={Math.min(Math.max(sizeDraft.length, 4), 18)}
                onChange={(event) => setSizeDraft(event.target.value)}
                onBlur={commitSize}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') {
                    setSizeDraft(beetle.size === '—' ? '' : beetle.size)
                    event.currentTarget.blur()
                  }
                }}
                aria-label="修改尺寸或重量"
                placeholder="尺寸"
              />
            </div>
          </div>

          <button className="plain-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="drawer-body">
        <div className="drawer-banner" />

        <div className="record-workspace">
          <section className="timeline-section">
            <div className="timeline-head">
              <h3>進食／換耗材紀錄</h3>
              <div className="timeline-actions">
                <span>{beetle.feedingRecords?.length || 0} 筆</span>
                <button className="create-button compact-button" type="button" onClick={() => setShowRecordForm(true)}>
                  <Plus size={15} /> 新增紀錄
                </button>
              </div>
            </div>

            <div className="timeline">
              {[...(beetle.feedingRecords || [])].reverse().map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-dot" />
                  <div>
                    <div className="record-line">
                      <b>{item.type}</b>
                      <time>{item.date}</time>
                    </div>
                    <p>{item.note}</p>
                    <div className="record-actions">
                      <button type="button" onClick={() => openEdit(item)}><Pencil size={12} /> 修改</button>
                      <button type="button" onClick={() => onDeleteRecord(beetle.id, item.id)}><Trash2 size={12} /> 刪除</button>
                    </div>
                  </div>
                </div>
              ))}

              {!beetle.feedingRecords?.length && <p className="empty-record">尚無紀錄</p>}
            </div>
          </section>

        </div>
      </div>

      {showRecordForm && (
        <div className="modal-backdrop drawer-record-backdrop" onClick={() => setShowRecordForm(false)}>
          <form className="record-modal feed-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header record-form-header">
              <h2>新增一筆紀錄</h2>
              <button className="plain-icon" type="button" onClick={() => setShowRecordForm(false)} aria-label="關閉新增紀錄">
                <X size={19} />
              </button>
            </div>
            <div className="feed-fields">
              <label className="feed-field">
                <span>日期</span>
                <input
                  type="date"
                  value={record.date.replaceAll('/', '-')}
                  onChange={(event) =>
                    setRecord((current) => ({
                      ...current,
                      date: event.target.value.replaceAll('-', '/'),
                    }))
                  }
                  aria-label="日期"
                />
              </label>

              <label className="feed-field">
                <span>類型</span>
                <select
                  value={record.type}
                  onChange={(event) => setRecord((current) => ({ ...current, type: event.target.value }))}
                >
                  {detailTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="feed-field">
              <span>備註</span>
              <textarea
                required
                value={record.note}
                onChange={(event) => setRecord((current) => ({ ...current, note: event.target.value }))}
                placeholder="輸入進食、換耗材、化蛹或羽化備註"
              />
            </label>

            <button className="create-button">
              <Plus size={16} /> 儲存紀錄
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}

function DashboardApp({ session, onLogout }) {
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(dashboardStorageKey)) || initialData
    } catch {
      return initialData
    }
  })
  const [cloudLoaded, setCloudLoaded] = useState(!isSupabaseConfigured || !session)
  const [syncState, setSyncState] = useState(isSupabaseConfigured ? 'loading' : 'local')
  const [collapsed, setCollapsed] = useState(() =>
    window.matchMedia('(max-width: 640px)').matches,
  )
  const [showForm, setShowForm] = useState(false)
  const [active, setActive] = useState(() => ({
    category: initialData[0],
    lineage: initialData[0].lineages[0],
  }))
  const [selectedBeetle, setSelectedBeetle] = useState(null)
  const [relationTarget, setRelationTarget] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !session) {
      localStorage.setItem(dashboardStorageKey, JSON.stringify(data))
      return
    }

    if (!cloudLoaded) return

    const timeout = window.setTimeout(async () => {
      setSyncState('saving')
      const { error } = await supabase
        .from('beetle_dashboards')
        .upsert({
          user_id: session.user.id,
          data,
          updated_at: new Date().toISOString(),
        })

      setSyncState(error ? 'error' : 'synced')
    }, 450)

    return () => window.clearTimeout(timeout)
  }, [data, session, cloudLoaded])

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return

    let alive = true
    const loadCloudData = async () => {
      setCloudLoaded(false)
      setSyncState('loading')
      const { data: row, error } = await supabase
        .from('beetle_dashboards')
        .select('data')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!alive) return

      if (error) {
        setSyncState('error')
        setCloudLoaded(true)
        return
      }

      if (Array.isArray(row?.data) && row.data.length) {
        setData(row.data)
      } else {
        await supabase
          .from('beetle_dashboards')
          .upsert({
            user_id: session.user.id,
            data: initialData,
            updated_at: new Date().toISOString(),
          })
      }

      setSyncState('synced')
      setCloudLoaded(true)
    }

    loadCloudData()
    return () => {
      alive = false
    }
  }, [session])

  useEffect(() => {
    const stillExists = data.some((category) =>
      category.lineages.some((lineage) => lineage.lineageId === active.lineage.lineageId),
    )
    if (!stillExists && data[0]?.lineages?.[0]) {
      setActive({ category: data[0], lineage: data[0].lineages[0] })
    }
  }, [data, active.lineage.lineageId])

  const selectLineage = (category, lineage) => {
    setActive({ category, lineage })
    setSelectedBeetle(null)
  }

  const create = (payload) => {
    if (payload.record && payload.lineageId) {
      setData((items) =>
        items.map((category) =>
          category.categoryId !== payload.categoryId
            ? category
            : {
                ...category,
                lineages: category.lineages.map((lineage) =>
                  lineage.lineageId !== payload.lineageId
                    ? lineage
                    : {
                        ...lineage,
                        familyTree: {
                          ...lineage.familyTree,
                          children: [...(lineage.familyTree.children || []), payload.record],
                        },
                      },
                ),
              },
        ),
      )
      return
    }

    if (payload.lineage) {
      const category = data.find((item) => item.categoryId === payload.categoryId)
      if (!category) return
      const updated = { ...category, lineages: [...category.lineages, payload.lineage] }
      setData((items) => items.map((item) => (item.categoryId === payload.categoryId ? updated : item)))
      setActive({ category: updated, lineage: payload.lineage })
      return
    }

    setData((items) => [...items, payload])
    setActive({ category: payload, lineage: payload.lineages[0] })
  }

  const addRecord = (beetleId, record) => {
    const update = (node) =>
      node.id === beetleId
        ? {
            ...node,
            attributes: {
              ...node.attributes,
              ...(record.type === '化蛹' ? { pupaDate: record.date } : {}),
              ...(record.type === '羽化' ? { hatchDate: record.date } : {}),
            },
            feedingRecords: [...(node.feedingRecords || []), record],
          }
        : {
            ...node,
            partners: (node.partners || []).map(update),
            children: (node.children || []).map(update),
          }

    setData((categories) =>
      categories.map((category) => ({
        ...category,
        lineages: category.lineages.map((lineage) =>
          lineage.lineageId === active.lineage.lineageId
            ? { ...lineage, familyTree: update(lineage.familyTree) }
            : lineage,
        ),
      })),
    )

    setSelectedBeetle((current) =>
      current?.id === beetleId
        ? {
            ...current,
            attributes: {
              ...current.attributes,
              ...(record.type === '化蛹' ? { pupaDate: record.date } : {}),
              ...(record.type === '羽化' ? { hatchDate: record.date } : {}),
            },
            feedingRecords: [...(current.feedingRecords || []), record],
          }
        : current,
    )
  }

  const updateBeetle = (beetleId, attributes) => {
    const update = (node) => node.id === beetleId
      ? { ...node, attributes: { ...node.attributes, ...attributes } }
      : { ...node, partners: (node.partners || []).map(update), children: (node.children || []).map(update) }
    setData((categories) => categories.map((category) => ({
      ...category,
      lineages: category.lineages.map((lineage) => ({ ...lineage, familyTree: update(lineage.familyTree) })),
    })))
    setSelectedBeetle((current) => current?.id === beetleId ? { ...current, attributes: { ...current.attributes, ...attributes } } : current)
  }

  const updateBeetleSize = (beetleId, size) => {
    const update = (node) => node.id === beetleId
      ? { ...node, size }
      : { ...node, partners: (node.partners || []).map(update), children: (node.children || []).map(update) }
    setData((categories) => categories.map((category) => ({
      ...category,
      lineages: category.lineages.map((lineage) => ({ ...lineage, familyTree: update(lineage.familyTree) })),
    })))
    setSelectedBeetle((current) => current?.id === beetleId ? { ...current, size } : current)
  }

  const updateRecord = (beetleId, record) => {
    const update = (node) => node.id === beetleId
      ? { ...node, feedingRecords: (node.feedingRecords || []).map((item) => item.id === record.id ? record : item) }
      : { ...node, partners: (node.partners || []).map(update), children: (node.children || []).map(update) }
    setData((categories) => categories.map((category) => ({ ...category, lineages: category.lineages.map((lineage) => ({ ...lineage, familyTree: update(lineage.familyTree) })) })))
    setSelectedBeetle((current) => current?.id === beetleId ? { ...current, feedingRecords: (current.feedingRecords || []).map((item) => item.id === record.id ? record : item) } : current)
  }

  const deleteRecord = (beetleId, recordId) => {
    if (!window.confirm('確定要刪除這筆流水帳紀錄嗎？')) return
    const update = (node) => node.id === beetleId
      ? { ...node, feedingRecords: (node.feedingRecords || []).filter((item) => item.id !== recordId) }
      : { ...node, partners: (node.partners || []).map(update), children: (node.children || []).map(update) }
    setData((categories) => categories.map((category) => ({ ...category, lineages: category.lineages.map((lineage) => ({ ...lineage, familyTree: update(lineage.familyTree) })) })))
    setSelectedBeetle((current) => current?.id === beetleId ? { ...current, feedingRecords: (current.feedingRecords || []).filter((item) => item.id !== recordId) } : current)
  }

  const createRelation = (targetId, relationType, record) => {
    const update = (node) => {
      const partnerIndex = (node.partners || []).findIndex((partner) => partner.id === targetId)

      if (node.id === targetId) {
        return relationType === 'partner'
          ? { ...node, partners: [...(node.partners || []), record] }
          : { ...node, children: [...(node.children || []), record] }
      }

      if (partnerIndex >= 0) {
        return relationType === 'partner'
          ? { ...node, partners: [...(node.partners || []), record] }
          : { ...node, children: [...(node.children || []), record] }
      }

      return {
        ...node,
        partners: (node.partners || []).map(update),
        children: (node.children || []).map(update),
      }
    }

    setData((categories) => categories.map((category) => ({
      ...category,
      lineages: category.lineages.map((lineage) =>
        lineage.lineageId === active.lineage.lineageId
          ? { ...lineage, familyTree: update(lineage.familyTree) }
          : lineage,
      ),
    })))
  }

  const deleteNode = (nodeId) => {
    if (nodeId === active.lineage.familyTree.id || !window.confirm('確定要刪除這個族譜節點及其後代嗎？')) return
    const remove = (node) => ({
      ...node,
      partners: (node.partners || []).filter((partner) => partner.id !== nodeId).map(remove),
      children: (node.children || []).filter((child) => child.id !== nodeId).map(remove),
    })
    setData((categories) => categories.map((category) => ({ ...category, lineages: category.lineages.map((lineage) => lineage.lineageId === active.lineage.lineageId ? { ...lineage, familyTree: remove(lineage.familyTree) } : lineage) })))
    setSelectedBeetle(null)
  }

  const editCategory = (category) => {
    const commonName = window.prompt('中文俗名', category.commonName)
    if (!commonName) return
    const scientificName = window.prompt('學名簡稱', category.scientificName) || category.scientificName
    setData((items) => items.map((item) => item.categoryId === category.categoryId ? { ...item, commonName, scientificName } : item))
  }

  const deleteCategory = (categoryId) => {
    if (data.length <= 1) return window.alert('至少需要保留一個物種。')
    if (!window.confirm('確定要刪除這個物種與底下所有血統嗎？')) return
    setData((items) => items.filter((item) => item.categoryId !== categoryId))
  }

  const editLineage = (lineage) => {
    const lineageName = window.prompt('血統名稱', lineage.lineageName)
    if (!lineageName) return
    const generationCode = window.prompt('代號（WD／WF／CBF）', getGenerationCode(lineage) || '') || getGenerationCode(lineage)
    setData((items) => items.map((category) => ({ ...category, lineages: category.lineages.map((item) => item.lineageId === lineage.lineageId ? { ...item, lineageName, generationCode } : item) })))
  }

  const deleteLineage = (lineageId) => {
    if (!window.confirm('確定要刪除這個血統嗎？')) return
    const owner = data.find((category) => category.lineages.some((lineage) => lineage.lineageId === lineageId))
    if (owner?.lineages.length <= 1) return window.alert('每個物種至少需要保留一個血統。')
    setData((items) => items.map((category) => ({ ...category, lineages: category.lineages.filter((lineage) => lineage.lineageId !== lineageId) })))
    setSelectedBeetle(null)
  }

  const latest =
    data
      .flatMap((category) => category.lineages.map((lineage) => ({ category, lineage })))
      .find((item) => item.lineage.lineageId === active.lineage.lineageId) || {
      category: data[0],
      lineage: data[0].lineages[0],
    }

  return (
    <div className="app-shell min-h-screen">
      <header className="global-brand">
        <span>路卡微光｜Lucanus Glow</span>
        <div className="global-session">
          <span>{syncState === 'local' ? '本機模式' : syncState === 'saving' ? '同步中' : syncState === 'error' ? '同步異常' : '已同步'}</span>
          {session && <button type="button" onClick={onLogout}>登出</button>}
        </div>
      </header>

      <div className="dashboard-body">
        <SidebarMenu
          data={data}
          activeLineage={latest.lineage}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          onSelect={selectLineage}
          onCreate={() => setShowForm(true)}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
        />

        <main className="main-content">
          <header className="content-header">
            <div>
              <span className="eyebrow">{latest.category.commonName}</span>
              <h1>{latest.lineage.lineageName}</h1>
            </div>

            <div className="header-actions">
              <button className="ghost-action" type="button" onClick={() => editLineage(latest.lineage)}><Pencil size={14} /> 修改血統</button>
              <button className="ghost-action danger" type="button" onClick={() => deleteLineage(latest.lineage.lineageId)}><Trash2 size={14} /> 刪除血統</button>
              <button className="mobile-menu" onClick={() => setCollapsed((value) => !value)}>
                <Menu size={19} />
              </button>
            </div>
          </header>

          <div className="tree-description">
            <Dna size={17} />
            <span>點選任一個體節點，即可查看個體飼育紀錄與新增紀錄。</span>
          </div>

          <FamilyTree
            lineage={latest.lineage}
            onNodeSelect={setSelectedBeetle}
            onDeleteNode={deleteNode}
            onAddRelation={setRelationTarget}
          />
        </main>

        <BeetleDetailDrawer
          beetle={selectedBeetle}
          onClose={() => setSelectedBeetle(null)}
          onAddRecord={addRecord}
          onUpdateRecord={updateRecord}
          onDeleteRecord={deleteRecord}
          onUpdateBeetle={updateBeetle}
          onUpdateSize={updateBeetleSize}
        />

        {relationTarget && (
          <RelationForm
            target={relationTarget}
            onClose={() => setRelationTarget(null)}
            onCreate={createRelation}
          />
        )}

        {showForm && (
          <CreateRecordForm
            data={data}
            onClose={() => setShowForm(false)}
            onCreate={create}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let alive = true
    const acceptSession = async (nextSession) => {
      const email = nextSession?.user?.email?.toLowerCase()
      const allowed = email === authEmail

      if (!nextSession || !allowed || isSessionExpired()) {
        if (nextSession) await supabase.auth.signOut()
        localStorage.removeItem(loginAtStorageKey)
        if (alive) setSession(null)
        return
      }

      if (!localStorage.getItem(loginAtStorageKey)) {
        localStorage.setItem(loginAtStorageKey, String(Date.now()))
      }
      if (alive) setSession(nextSession)
    }

    supabase.auth.getSession().then(async ({ data: authData }) => {
      await acceptSession(authData.session)
      if (alive) setAuthLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      acceptSession(nextSession)
    })

    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    localStorage.removeItem(loginAtStorageKey)
    await supabase.auth.signOut()
    setSession(null)
  }

  if (!isSupabaseConfigured) {
    return <DashboardApp session={null} onLogout={null} />
  }

  if (authLoading) {
    return (
      <main className="login-shell">
        <section className="login-panel compact">
          <p className="eyebrow">Lucanus Glow</p>
          <h1>登入狀態確認中</h1>
        </section>
      </main>
    )
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} />
  }

  return <DashboardApp session={session} onLogout={logout} />
}

createRoot(document.getElementById('root')).render(<App />)
