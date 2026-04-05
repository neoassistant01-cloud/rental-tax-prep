import { useState, useEffect, useRef } from 'react'
import { Chart, ArcElement, DoughnutController } from 'chart.js'

Chart.register(ArcElement, DoughnutController)

const CATEGORIES = [
  { id: 'advertising', name: 'Advertising', color: '#8B5CF6' },
  { id: 'auto', name: 'Auto & Mileage', color: '#EC4899' },
  { id: 'insurance', name: 'Insurance', color: '#F97316' },
  { id: 'legal', name: 'Legal & Professional', color: '#06B6D4' },
  { id: 'management', name: 'Management Fees', color: '#10B981' },
  { id: 'repairs', name: 'Repairs & Maintenance', color: '#EAB308' },
  { id: 'taxes', name: 'Taxes & Interest', color: '#3B82F6' },
  { id: 'utilities', name: 'Utilities', color: '#14B8A6' },
  { id: 'depreciation', name: 'Depreciation', color: '#6B7280' },
  { id: 'other', name: 'Other', color: '#78716C' },
]

const STORAGE_KEY = 'rental-tax-expenses'

function App() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [expenses, setExpenses] = useState([])
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'other',
    description: '',
  })
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setExpenses(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load expenses:', e)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }, [expenses])

  // Filter expenses by year
  const yearExpenses = expenses.filter(e => e.date.startsWith(String(selectedYear)))

  // Calculate totals by category
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = yearExpenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    return acc
  }, {})

  const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0)

  // Render chart
  useEffect(() => {
    if (!chartRef.current) return
    
    const ctx = chartRef.current.getContext('2d')
    const data = CATEGORIES.map(cat => categoryTotals[cat.id]).filter(v => v > 0)
    const colors = CATEGORIES.map(cat => cat.color).filter((_, i) => categoryTotals[CATEGORIES[i].id] > 0)

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    if (data.length > 0) {
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          cutout: '65%',
        }
      })
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [categoryTotals])

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    handleFile(file)
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(parseFloat(form.amount))) return
    
    const newExpense = {
      id: Date.now().toString(),
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description || 'No description',
      receipt: preview,
    }
    setExpenses([...expenses, newExpense])
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: 'other',
      description: '',
    })
    setPreview(null)
  }

  const handleDelete = (id) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(16, 185, 129)
    doc.text('Rental Tax Prep - Schedule E Report', 14, 22)
    
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Tax Year: ${selectedYear}`, 14, 32)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)
    
    // Summary
    doc.setFontSize(16)
    doc.setTextColor(0)
    doc.text(`Total Expenses: $${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 52)
    
    // Category breakdown
    const categoryData = CATEGORIES
      .filter(cat => categoryTotals[cat.id] > 0)
      .map(cat => [cat.name, `$${categoryTotals[cat.id].toLocaleString(undefined, { minimumFractionDigits: 2 })}`])
    
    autoTable(doc, {
      startY: 60,
      head: [['Category', 'Amount']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    })
    
    // Expenses table
    const expenseData = yearExpenses.map(e => [
      e.date,
      CATEGORIES.find(c => c.id === e.category)?.name || e.category,
      e.description,
      `$${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ])
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] },
    })
    
    doc.save(`rental-tax-${selectedYear}.pdf`)
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h1>Rental Tax Prep</h1>
        </div>
        <div className="header-actions">
          <select 
            className="year-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={exportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Left Panel */}
        <div className="left-panel">
          {/* Upload Zone */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Add Receipt
              </h2>
            </div>
            
            <div 
              className={`upload-zone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <h3>Drop receipt image here</h3>
              <p>or click to upload from camera/files</p>
            </div>
            
            <input 
              type="file" 
              id="file-input" 
              className="hidden-input"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
            />
            
            {preview && (
              <div className="preview-section">
                <img src={preview} alt="Receipt preview" className="preview-thumb" />
                <div className="preview-info">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Receipt attached
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="expense-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="form-input"
                    value={form.date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input 
                    type="number" 
                    name="amount"
                    className="form-input amount-input"
                    placeholder="$0.00"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  name="category"
                  className="form-select"
                  value={form.category}
                  onChange={handleFormChange}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  name="description"
                  className="form-input"
                  placeholder="e.g., Plumbing repair for unit 2B"
                  value={form.description}
                  onChange={handleFormChange}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add Expense
              </button>
            </form>
          </div>

          {/* Expense List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Expenses ({yearExpenses.length})
              </h2>
            </div>

            {yearExpenses.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
                <h3>No expenses yet</h3>
                <p>Add your first expense to get started</p>
              </div>
            ) : (
              <div className="expense-list">
                {yearExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                  <div key={expense.id} className="expense-item">
                    <span className="expense-date">{expense.date}</span>
                    <span className="expense-desc">{expense.description}</span>
                    <span 
                      className="category-pill"
                      style={{ 
                        backgroundColor: CATEGORIES.find(c => c.id === expense.category)?.color + '20',
                        color: CATEGORIES.find(c => c.id === expense.category)?.color
                      }}
                    >
                      <span 
                        className="category-dot"
                        style={{ backgroundColor: CATEGORIES.find(c => c.id === expense.category)?.color }}
                      />
                      {CATEGORIES.find(c => c.id === expense.category)?.name}
                    </span>
                    <span className="expense-amount">
                      ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button 
                      className="btn btn-danger expense-delete"
                      onClick={() => handleDelete(expense.id)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Dashboard */}
        <div className="dashboard">
          <div className="card total-card">
            <div className="total-label">Total Expenses</div>
            <div className="total-amount">
              ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '16px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
              Breakdown
            </h2>

            {grandTotal === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <p>Add expenses to see breakdown</p>
              </div>
            ) : (
              <div className="chart-container">
                <div className="donut-wrapper">
                  <canvas ref={chartRef}></canvas>
                </div>
                <div className="chart-legend">
                  {CATEGORIES.filter(cat => categoryTotals[cat.id] > 0).map(cat => (
                    <div key={cat.id} className="legend-item">
                      <span>
                        <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                      <span className="legend-amount">
                        ${categoryTotals[cat.id].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '16px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Tax Tips
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>✓ Keep records</strong> — Save all receipts and documents for at least 3 years.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>✓ Track depreciation</strong> — Even if you don't deduct it now, it reduces your capital gains tax later.
              </p>
              <p>
                <strong style={{ color: 'var(--accent-primary)' }}>✓ Separate personal/Business</strong> — Use a dedicated bank account for rental income.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
