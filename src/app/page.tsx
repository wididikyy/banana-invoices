"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, Printer, AlertCircle } from "lucide-react"

interface InvoiceItem {
  description: string
  quantity: number
  price: number
  days: number
}

interface InvoiceData {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  ppnRate: number
  pphRate: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  notes: string
}

interface Totals {
  subtotal: number
  ppnAmount: number
  pphAmount: number
  total: number
}

const Home: React.FC = () => {
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    ppnRate: 0,
    pphRate: 0,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
  })

  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0, days: 1 }])

  const [totals, setTotals] = useState<Totals>({
    subtotal: 0,
    ppnAmount: 0,
    pphAmount: 0,
    total: 0,
  })

  const [error, setError] = useState<string>("")

  // Generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = (): string => {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
      const date = new Date()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()
      return `INV-${randomStr}/BNN/${month}/${year}`
    }

    const today = new Date().toISOString().split("T")[0]
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)
    const dueDateStr = dueDate.toISOString().split("T")[0]

    setInvoice((prev) => ({
      ...prev,
      invoiceNumber: generateInvoiceNumber(),
      issueDate: today,
      dueDate: dueDateStr,
    }))
  }, [])

  // Calculate totals whenever items or tax rates change
  useEffect(() => {
    calculateTotals()
  }, [items, invoice.ppnRate, invoice.pphRate])

  const calculateItemTotal = (item: InvoiceItem): number => {
    const quantity = Number.parseInt(String(item.quantity)) || 0
    const price = Number.parseFloat(String(item.price)) || 0
    const days = Number.parseInt(String(item.days)) || 1
    return quantity * price * days
  }

  const calculateTotals = (): void => {
    const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)

    // PPH is calculated from subtotal and subtracted first
    // PPN is then calculated from the remaining amount (subtotal - PPH)
    // This follows Indonesian tax accounting standards
    const pphAmount = (subtotal * (Number.parseFloat(String(invoice.pphRate)) || 0)) / 100
    const subtotalAfterPPH = Math.max(0, subtotal - pphAmount) // Ensure non-negative
    const ppnAmount = (subtotalAfterPPH * (Number.parseFloat(String(invoice.ppnRate)) || 0)) / 100
    const total = subtotalAfterPPH + ppnAmount

    setTotals({ subtotal, ppnAmount, pphAmount, total })
  }

  const formatCurrency = (amount: number): string => {
    return "Rp " + Math.floor(amount).toLocaleString("id-ID")
  }

  const addItem = (): void => {
    setItems([...items, { description: "", quantity: 1, price: 0, days: 1 }])
  }

  const removeItem = (index: number): void => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number): void => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    setItems(newItems)
  }

  const updateInvoice = (field: keyof InvoiceData, value: string | number): void => {
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (): void => {
    setError("")

    // Validation
    if (!invoice.customerName.trim()) {
      setError("Nama pelanggan harus diisi")
      return
    }

    if (items.some((item) => !item.description.trim())) {
      setError("Semua item harus memiliki deskripsi")
      return
    }

    // Generate PDF
    generatePDF()
  }

  const generatePDF = (): void => {
    // Create a printable invoice view
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      setError("Pop-up diblokir. Mohon izinkan pop-up untuk generate invoice.")
      return
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoice.invoiceNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
            width: 210mm;
            height: 297mm;
            position: relative;
            background-image: url('${window.location.origin}/bg.png');
            background-size: 210mm auto;
            background-repeat: no-repeat;
            background-position: top left;
          }

          .container {
            width: 180mm;
            margin: 0 auto;
            padding: 60mm 10mm;
            position: relative;
            z-index: 1;
          }

          .header {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #ffc300;
            padding-bottom: 10px;
          }

          .company-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #ffc300;
          }

          .invoice-title {
            font-size: 20px;
            font-weight: bold;
            color: #fca311;
            text-align: right;
          }

          .invoice-number {
            font-size: 14px;
            color: #666;
            text-align: right;
          }

          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            gap: 10px;
          }

          .info-box {
            flex: 1;
            background-color: #f8fafc;
            padding: 8px;
            border-radius: 4px;
            border-left: 4px solid #ffc300;
          }

          .info-box h3 {
            margin: 0 0 5px 0;
            color: #64748b;
            font-size: 11px;
            font-weight: bold;
          }

          .info-box p {
            margin: 3px 0;
            font-size: 10px;
          }

          .details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            gap: 10px;
          }

          .details-box {
            flex: 1;
            background-color: #f8fafc;
            padding: 8px;
            border-radius: 4px;
            border-left: 4px solid #ffc300;
          }

          .details-box h4 {
            margin: 0 0 3px 0;
            color: #64748b;
            font-size: 10px;
            font-weight: bold;
          }

          .details-box p {
            margin: 0;
            font-size: 10px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            background-color: #fff;
            border-radius: 4px;
            overflow: hidden;
          }

          table th,
          table td {
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
          }

          table th {
            background-color: #ffc300;
            color: white;
            font-weight: bold;
          }

          table td:last-child,
          table th:last-child,
          table td:nth-last-child(2),
          table th:nth-last-child(2),
          table td:nth-last-child(3),
          table th:nth-last-child(3) {
            text-align: right;
          }

          .summary {
            float: right;
            width: 35%;
            margin-top: 5px;
          }

          .summary table {
            margin-bottom: 0;
          }

          .summary table th {
            background-color: transparent;
            color: #333;
            padding: 3px 0;
            border: none;
            text-align: left;
            font-weight: normal;
          }

          .summary table td {
            border: none;
            padding: 3px 0;
            font-size: 10px;
          }

          .summary table tr:last-child {
            font-weight: bold;
            font-size: 12px;
            border-top: 2px solid #ffc300;
            padding-top: 5px;
          }

          .summary table tr:last-child td {
            padding-top: 5px;
          }

          .clear {
            clear: both;
          }

          .notes {
            margin-top: 12px;
            border-top: 1px solid #eee;
            padding-top: 8px;
          }

          .notes h3 {
            margin-top: 0;
            font-size: 11px;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
          }

          .notes p {
            font-size: 10px;
            margin: 0;
          }

          .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 9px;
            color: #777;
            border-top: 1px dashed #ddd;
            padding-top: 8px;
          }

          .footer p {
            margin: 3px 0;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .container {
              padding: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <div class="company-name">PT. BANANA ANUGRAH PERKASA</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">#${invoice.invoiceNumber}</div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>Informasi Pelanggan</h3>
              <p><strong>${invoice.customerName}</strong></p>
              ${invoice.customerEmail ? `<p>${invoice.customerEmail}</p>` : ""}
              ${invoice.customerPhone ? `<p>Telepon: ${invoice.customerPhone}</p>` : ""}
              ${invoice.customerAddress ? `<p>Alamat: ${invoice.customerAddress}</p>` : ""}
            </div>
          </div>

          <div class="details-section">
            <div class="details-box">
              <h4>Nomor Invoice</h4>
              <p>${invoice.invoiceNumber}</p>
            </div>
            <div class="details-box">
              <h4>Tanggal Penerbitan</h4>
              <p>${new Date(invoice.issueDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div class="details-box">
              <h4>Tanggal Jatuh Tempo</h4>
              <p>${new Date(invoice.dueDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Harga</th>
                <th>Jumlah Hari</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${item.days}</td>
                  <td>${formatCurrency(calculateItemTotal(item))}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>${formatCurrency(totals.subtotal)}</td>
              </tr>
              ${
                invoice.pphRate > 0
                  ? `
                <tr>
                  <td>PPH (${invoice.pphRate}%):</td>
                  <td>-${formatCurrency(totals.pphAmount)}</td>
                </tr>
              `
                  : ""
              }
              ${
                invoice.ppnRate > 0
                  ? `
                <tr>
                  <td>PPN (${invoice.ppnRate}%):</td>
                  <td>+${formatCurrency(totals.ppnAmount)}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td><strong>Total:</strong></td>
                <td><strong>${formatCurrency(totals.total)}</strong></td>
              </tr>
            </table>
          </div>

          <div class="clear"></div>

          ${
            invoice.notes
              ? `
            <div class="notes">
              <h3>Catatan</h3>
              <p>${invoice.notes}</p>
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>Terima kasih atas bisnis Anda!</p>
            <p>Jika Anda memiliki pertanyaan tentang faktur ini, silakan hubungi kami</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
          <p className="text-gray-600 mt-1">Buat invoice untuk pelanggan di bawah ini</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoiceNumber">Nomor Invoice</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={(e) => updateInvoice("invoiceNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">Tanggal Penerbitan</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={invoice.issueDate}
                    onChange={(e) => updateInvoice("issueDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Tanggal Jatuh Tempo</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => updateInvoice("dueDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ppnRate">PPN (%)</Label>
                  <Input
                    id="ppnRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoice.ppnRate}
                    onChange={(e) => updateInvoice("ppnRate", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="pphRate">PPH (%)</Label>
                  <Input
                    id="pphRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoice.pphRate}
                    onChange={(e) => updateInvoice("pphRate", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Nama</Label>
                  <Input
                    id="customerName"
                    value={invoice.customerName}
                    onChange={(e) => updateInvoice("customerName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={invoice.customerEmail}
                    onChange={(e) => updateInvoice("customerEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Nomor Telepon</Label>
                  <Input
                    id="customerPhone"
                    value={invoice.customerPhone}
                    onChange={(e) => updateInvoice("customerPhone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Alamat</Label>
                  <Textarea
                    id="customerAddress"
                    rows={3}
                    value={invoice.customerAddress}
                    onChange={(e) => updateInvoice("customerAddress", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Item Invoice</CardTitle>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Deskripsi</th>
                      <th className="text-left py-3 px-2 w-24">Jumlah</th>
                      <th className="text-left py-3 px-2 w-32">Harga</th>
                      <th className="text-left py-3 px-2 w-24">Hari</th>
                      <th className="text-right py-3 px-2 w-32">Total</th>
                      <th className="text-center py-3 px-2 w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-2">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Deskripsi item"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.days}
                            onChange={(e) => updateItem(index, "days", Number.parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(calculateItemTotal(item))}</td>
                        <td className="py-3 px-2 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-full md:w-80 bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPH ({invoice.pphRate}%):</span>
                    <span className="font-medium">-{formatCurrency(totals.pphAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN ({invoice.ppnRate}%):</span>
                    <span className="font-medium">+{formatCurrency(totals.ppnAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-foreground">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                rows={3}
                value={invoice.notes}
                onChange={(e) => updateInvoice("notes", e.target.value)}
                placeholder="Tambahkan catatan untuk pelanggan..."
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button onClick={handleSubmit} size="lg" className="w-full md:w-auto">
            <Printer className="w-5 h-5 mr-2" />
            Generate & Print Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Home
