// src/context/LangContext.jsx
import { createContext, useContext, useState } from 'react'

// ── Traducciones ──────────────────────────────────────────────────────────────
export const translations = {
  es: {
    // Nav
    nav_dashboard: 'Inicio',
    nav_nuevo: 'Nuevo análisis',
    nav_historial: 'Historial',
    nav_programaciones: 'Programaciones',
    nav_signout: 'Salir',

    // Dashboard / Insights (página unificada)
    page_dashboard_title: 'Inicio',
    page_dashboard_subtitle: 'Resumen de actividad y análisis recomendados',

    stat_total: 'Total análisis',
    stat_total_sub: 'todos los tiempos',
    stat_completados: 'Completados',
    stat_completados_sub: 'listos para leer',
    stat_en_proceso: 'En proceso',
    stat_en_proceso_sub: 'ejecutándose ahora',
    stat_errores: 'Errores',
    stat_errores_sub: 'falló la ejecución',
    stat_sector_fav: 'Sector favorito',
    stat_tiempo_medio: 'Tiempo medio',
    stat_tiempo_medio_sub: 'por análisis completado',
    stat_sin_datos: 'sin datos',

    chart_sectores: 'Sectores más analizados',
    chart_regiones: 'Regiones más analizadas',
    chart_actividad_mensual: 'Actividad mensual',
    chart_distribucion: 'Distribución por estado',
    chart_semana: 'Actividad por semana',
    chart_combinaciones: 'Combinaciones más analizadas',
    chart_sin_datos: 'Sin datos',
    chart_sin_datos_suf: 'Sin datos suficientes',

    rec_title: 'Análisis recomendados para ti',
    rec_sin_historial: 'Aún no tienes historial. Aquí tienes algunos análisis populares para empezar:',
    rec_btn: 'Analizar →',

    btn_nuevo: '⊕ Nuevo análisis',

    // Historial
    page_historial_title: 'Historial',
    page_historial_subtitle: 'análisis realizados',
    historial_local_title: 'Informes locales',
    historial_local_desc: 'Análisis anteriores en',
    historial_no_nube: 'Aún no tienes análisis guardados en la nube.',
    historial_crear_primero: 'Crear el primero',
    historial_no_local: 'No hay informes en las carpetas locales.',
    historial_ver: 'Ver →',
    historial_col_sector: 'Sector',
    historial_col_region: 'Región',
    historial_col_estado: 'Estado',
    historial_col_creado: 'Creado',
    historial_col_pdf: 'PDF',
    historial_col_fecha: 'Fecha',
    historial_pag_anterior: '← Anterior',
    historial_pag_siguiente: 'Siguiente →',
    historial_btn_nuevo: '⊕ Nuevo',
    historial_eliminar_confirm: '¿Eliminar este análisis y su PDF?',
    historial_eliminar_error: 'Error al eliminar: ',

    // Programaciones
    page_prog_title: 'Programaciones',
    page_prog_subtitle: 'Análisis automáticos recurrentes',
    prog_nueva_btn: '⊕ Nueva programación',
    prog_cancelar: '✕ Cancelar',
    prog_form_title: 'Nueva programación',
    prog_sector: 'Sector',
    prog_region: 'Región',
    prog_frecuencia: 'Frecuencia',
    prog_hora: 'Hora de ejecución',
    prog_crear_btn: 'Crear programación',
    prog_guardando: 'Guardando...',
    prog_vacio: 'No tienes análisis programados todavía.',
    prog_crear_primera: 'Crear la primera',
    prog_activo: 'activo',
    prog_pausado: 'pausado',
    prog_editar: '✎ Editar',
    prog_eliminar_confirm: '¿Eliminar esta programación?',
    prog_estado: 'Estado',
    prog_activo_label: 'Activo',
    prog_pausado_label: 'Pausado',
    prog_modal_title: 'Editar programación',
    prog_modal_cancelar: 'Cancelar',
    prog_modal_guardar: 'Guardar cambios',
    prog_frec_daily: 'Diario',
    prog_frec_weekly: 'Semanal (lunes)',
    prog_frec_monthly: 'Mensual (día 1)',

    // Nuevo análisis
    page_nuevo_title: 'Nuevo análisis',

    // Login
    login_titulo: 'Sistema de investigación de mercado con IA',
    login_iniciar: 'Iniciar sesión',
    login_crear: 'Crear cuenta',
    login_email: 'Email',
    login_pass: 'Contraseña',
    login_olvidaste: '¿Olvidaste tu contraseña?',
    login_entrar: 'Entrar',
    login_cargando: 'Cargando...',
    login_recuperar_title: 'Recuperar contraseña',
    login_recuperar_desc: 'Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.',
    login_recuperar_btn: 'Enviar enlace de recuperación',
    login_enviando: 'Enviando...',
    login_volver: '← Volver al inicio de sesión',
    login_tfg: 'TFG · Sistema Multi-Agente de Investigación de Mercado',
    login_confirmar_msg: 'Revisa tu email para confirmar la cuenta.',
    login_recuperar_msg: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
  },

  en: {
    // Nav
    nav_dashboard: 'Dashboard',
    nav_nuevo: 'New analysis',
    nav_historial: 'History',
    nav_programaciones: 'Schedules',
    nav_signout: 'Sign out',

    // Dashboard / Insights
    page_dashboard_title: 'Dashboard',
    page_dashboard_subtitle: 'Activity summary and recommended analyses',

    stat_total: 'Total analyses',
    stat_total_sub: 'all time',
    stat_completados: 'Completed',
    stat_completados_sub: 'ready to read',
    stat_en_proceso: 'In progress',
    stat_en_proceso_sub: 'running now',
    stat_errores: 'Errors',
    stat_errores_sub: 'execution failed',
    stat_sector_fav: 'Top sector',
    stat_tiempo_medio: 'Avg. time',
    stat_tiempo_medio_sub: 'per completed analysis',
    stat_sin_datos: 'no data',

    chart_sectores: 'Most analysed sectors',
    chart_regiones: 'Most analysed regions',
    chart_actividad_mensual: 'Monthly activity',
    chart_distribucion: 'Status distribution',
    chart_semana: 'Weekly activity',
    chart_combinaciones: 'Most frequent combinations',
    chart_sin_datos: 'No data',
    chart_sin_datos_suf: 'Not enough data',

    rec_title: 'Recommended analyses for you',
    rec_sin_historial: 'No history yet. Here are some popular analyses to get started:',
    rec_btn: 'Analyse →',

    btn_nuevo: '⊕ New analysis',

    // History
    page_historial_title: 'History',
    page_historial_subtitle: 'analyses performed',
    historial_local_title: 'Local reports',
    historial_local_desc: 'Previous analyses in',
    historial_no_nube: 'No analyses saved in the cloud yet.',
    historial_crear_primero: 'Create the first one',
    historial_no_local: 'No reports found in local folders.',
    historial_ver: 'View →',
    historial_col_sector: 'Sector',
    historial_col_region: 'Region',
    historial_col_estado: 'Status',
    historial_col_creado: 'Created',
    historial_col_pdf: 'PDF',
    historial_col_fecha: 'Date',
    historial_pag_anterior: '← Previous',
    historial_pag_siguiente: 'Next →',
    historial_btn_nuevo: '⊕ New',
    historial_eliminar_confirm: 'Delete this analysis and its PDF?',
    historial_eliminar_error: 'Error deleting: ',

    // Schedules
    page_prog_title: 'Schedules',
    page_prog_subtitle: 'Automatic recurring analyses',
    prog_nueva_btn: '⊕ New schedule',
    prog_cancelar: '✕ Cancel',
    prog_form_title: 'New schedule',
    prog_sector: 'Sector',
    prog_region: 'Region',
    prog_frecuencia: 'Frequency',
    prog_hora: 'Execution time',
    prog_crear_btn: 'Create schedule',
    prog_guardando: 'Saving...',
    prog_vacio: 'No scheduled analyses yet.',
    prog_crear_primera: 'Create the first one',
    prog_activo: 'active',
    prog_pausado: 'paused',
    prog_editar: '✎ Edit',
    prog_eliminar_confirm: 'Delete this schedule?',
    prog_estado: 'Status',
    prog_activo_label: 'Active',
    prog_pausado_label: 'Paused',
    prog_modal_title: 'Edit schedule',
    prog_modal_cancelar: 'Cancel',
    prog_modal_guardar: 'Save changes',
    prog_frec_daily: 'Daily',
    prog_frec_weekly: 'Weekly (Monday)',
    prog_frec_monthly: 'Monthly (1st)',

    // New analysis
    page_nuevo_title: 'New analysis',

    // Login
    login_titulo: 'AI-powered market research system',
    login_iniciar: 'Sign in',
    login_crear: 'Create account',
    login_email: 'Email',
    login_pass: 'Password',
    login_olvidaste: 'Forgot your password?',
    login_entrar: 'Sign in',
    login_cargando: 'Loading...',
    login_recuperar_title: 'Reset password',
    login_recuperar_desc: 'Enter your email and we will send you a link to reset your password.',
    login_recuperar_btn: 'Send reset link',
    login_enviando: 'Sending...',
    login_volver: '← Back to sign in',
    login_tfg: 'Final Project · Multi-Agent Market Research System',
    login_confirmar_msg: 'Check your email to confirm your account.',
    login_recuperar_msg: 'If the email exists, you will receive a reset link.',
  }
}

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es')

  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const t = (key) => translations[lang][key] ?? key

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
