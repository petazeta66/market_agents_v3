// src/lib/api.js
// Cliente centralizado para todas las llamadas al backend FastAPI

import { supabase } from './supabaseClient'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No autenticado')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  }
}

async function request(method, path, body = null) {
  const headers = await authHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail || 'Error en la petición')
  }
  return res.json()
}

// ── Análisis ───────────────────────────────────────────────────────────
export const api = {
  crearAnalisis: (sector, region) =>
    request('POST', '/analisis', { sector, region }),

  listarAnalisis: (page = 1, limit = 10) =>
    request('GET', `/analisis?page=${page}&limit=${limit}`),

  obtenerAnalisis: (id) =>
    request('GET', `/analisis/${id}`),

  estadoAnalisis: (id) =>
    request('GET', `/analisis/${id}/estado`),

  eliminarAnalisis: (id) =>
    request('DELETE', `/analisis/${id}`),

  // ── Dashboard ─────────────────────────────────────────────────────
  dashboardStats: () =>
    request('GET', '/dashboard/stats'),

  // ── Informes locales ──────────────────────────────────────────────
  listarInformesLocales: () =>
    request('GET', '/informes-locales'),

  contenidoInformeLocal: (id) =>
    request('GET', `/informes-locales/${encodeURIComponent(id)}/contenido`),

  urlPdfLocal: (id) =>
    `${BASE_URL}/informes-locales/${encodeURIComponent(id)}/pdf`,

  // ── Insights ──────────────────────────────────────────────────────
  insights: () =>
    request('GET', '/insights'),
  listarProgramaciones: () =>
    request('GET', '/programaciones'),

  crearProgramacion: (data) =>
    request('POST', '/programaciones', data),

  toggleProgramacion: (id, activo) =>
    request('PATCH', `/programaciones/${id}`, { activo }),

  editarProgramacion: (id, datos) =>
    request('PATCH', `/programaciones/${id}`, datos),

  eliminarProgramacion: (id) =>
    request('DELETE', `/programaciones/${id}`),
}
