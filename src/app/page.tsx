"use client"

import React, { useState, useEffect } from "react"
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
  dpAmount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  notes: string
  signatureLocation: string
  signatureName: string
}

interface Totals {
  subtotal: number
  afterDP: number
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
    dpAmount: 0,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    notes: "Pembayaran bisa melalui : Nomer Rekening : 0091641177 (BCA : Reza Ferdyan A). || Qris By WhatsApp : 081334575487 / Driver || Cash",
    signatureLocation: "Banyuwangi",
    signatureName: "Reza Ferdyan A.",
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0, days: 1 }
  ])

  const [totals, setTotals] = useState<Totals>({
    subtotal: 0,
    afterDP: 0,
    ppnAmount: 0,
    pphAmount: 0,
    total: 0,
  })

  const [error, setError] = useState<string>("")

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

  useEffect(() => {
    calculateTotals()
  }, [items, invoice.ppnRate, invoice.pphRate, invoice.dpAmount])

  const calculateItemTotal = (item: InvoiceItem): number => {
    const quantity = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    const days = Number(item.days) || 1
    return quantity * price * days
  }

  const calculateTotals = (): void => {
    const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
    const dpAmount = Number(invoice.dpAmount) || 0
    const afterDP = Math.max(0, subtotal - dpAmount)
    const ppnAmount = (afterDP * (Number(invoice.ppnRate) || 0)) / 100
    const pphAmount = (afterDP * (Number(invoice.pphRate) || 0)) / 100
    const total = afterDP + ppnAmount + pphAmount

    setTotals({ subtotal, afterDP, ppnAmount, pphAmount, total })
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
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const updateInvoice = (field: keyof InvoiceData, value: string | number): void => {
    setInvoice((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (): void => {
    setError("")

    if (!invoice.customerName.trim()) {
      setError("Nama pelanggan harus diisi")
      return
    }

    if (items.some((item) => !item.description.trim())) {
      setError("Semua item harus memiliki deskripsi")
      return
    }

    generatePDF()
  }

  const formatDateIndonesian = (dateString: string): string => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const formatNotesWithLineBreaks = (notes: string): string => {
    return escapeHtml(notes).replace(/\n/g, '<br>')
  }

  const generatePDF = (): void => {
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
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000000;
            width: 148mm;
            height: 210mm;
            background: white;
          }
          
          .container {
            width: 100%;
            height: 100%;
            padding: 12mm 10mm;
            display: flex;
            flex-direction: column;
          }

          .header {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 6px;
          }

          .company-info { display: flex; align-items: center; gap: 8px; }
          .invoice-header { text-align: right; }
          .invoice-title { font-size: 16px; font-weight: bold; margin: 0; }
          .invoice-number { font-size: 11px; margin: 0; }

          .info-section {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 9px;
          }

          .info-box {
            flex: 1;
            background-color: #f8fafc;
            padding: 6px;
          }

          .info-box h3 { margin: 0 0 3px 0; font-size: 9px; font-weight: bold; }
          .info-box p { margin: 2px 0; font-size: 8px; }

          .details-section {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 8px;
          }

          .details-box {
            flex: 1;
            background-color: #f8fafc;
            padding: 5px;
          }

          .details-box h4 { margin: 0 0 2px 0; font-size: 8px; font-weight: bold; }
          .details-box p { margin: 0; font-size: 8px; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 8px;
          }

          table th, table td {
            padding: 4px 5px;
            text-align: left;
            border-bottom: 1px solid #c4c4c4;
          }

          table th {
            font-weight: bold;
            font-size: 9px;
          }

          table td:last-child, table th:last-child,
          table td:nth-last-child(2), table th:nth-last-child(2),
          table td:nth-last-child(3), table th:nth-last-child(3) {
            text-align: right;
          }

          .summary {
            width: 50%;
            margin-left: auto;
            margin-bottom: 8px;
            font-size: 9px;
          }

          .summary table { width: 100%; border-collapse: collapse; margin: 0; }
          .summary table th, .summary table td { padding: 2px 5px; text-align: left; border: none; }
          .summary table td:last-child { text-align: right; }
          
          .summary table tr:last-child {
            font-weight: bold;
            font-size: 11px;
          }
          
          .summary table tr:last-child td { padding-top: 4px; }

          .notes {
            margin-bottom: 8px;
            border-top: 1px solid #eee;
            padding-top: 12px;
            font-size: 8px;
          }

          .notes h3 { margin: 0 0 3px 0; font-size: 9px; font-weight: bold; color: #333; }
          .notes p { margin: 0; line-height: 1.4; }

          .signature-section {
            margin-top: 12px;
            margin-bottom: 8px;
            text-align: right;
            font-size: 8px;
          }

          .signature-box {
            display: inline-block;
            text-align: center;
            min-width: 100px;
          }

          .signature-box p { margin: 2px 0; }
          .signature-space { height: 40px; margin: 5px 0; }
          
          .signature-name {
            padding-top: 2px;
            display: inline-block;
            min-width: 100px;
          }

          .footer {
            margin-top: auto;
            font-size: 8px;
            border-top: 1px dashed #c4c4c4;
            padding-top: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .footer img {
            width: 60px;
            height: 60px;
            object-fit: contain;
            display: block;
          }

          .footer-text {
            line-height: 1.5;
          }
          
          .footer-text p {
            margin: 2px 0;
          }

          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <img src="/img-small.png" alt="Logo" width="80" height="60" />
              <h1>PT. Banana 88 - Anugrah Perkasa</h1>
            </div>
            <div class="invoice-header">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">${invoice.invoiceNumber}</div>
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
              <p>${new Date(invoice.issueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
            <div class="details-box">
              <h4>Tanggal Jatuh Tempo</h4>
              <p>${new Date(invoice.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th style="width: 12%;">Jumlah</th>
                <th style="width: 18%;">Harga</th>
                <th style="width: 12%;">Jumlah Hari</th>
                <th style="width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${item.days}</td>
                  <td>${formatCurrency(calculateItemTotal(item))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="summary">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>${formatCurrency(totals.subtotal)}</td>
              </tr>
              ${invoice.dpAmount > 0 ? `
                <tr>
                  <td>DP:</td>
                  <td>${formatCurrency(invoice.dpAmount)}</td>
                </tr>
              ` : ""}
              ${invoice.ppnRate > 0 ? `
                <tr>
                  <td>PPN (${invoice.ppnRate}%):</td>
                  <td>${formatCurrency(totals.ppnAmount)}</td>
                </tr>
              ` : ""}
              ${invoice.pphRate > 0 ? `
                <tr>
                  <td>PPH (${invoice.pphRate}%):</td>
                  <td>${formatCurrency(totals.pphAmount)}</td>
                </tr>
              ` : ""}
              <tr>
                <td><strong>Total:</strong></td>
                <td><strong>${formatCurrency(totals.total)}</strong></td>
              </tr>
            </table>
          </div>

          ${invoice.notes ? `
            <div class="notes">
              <h3>Catatan</h3>
              <p>${formatNotesWithLineBreaks(invoice.notes)}</p>
            </div>
          ` : ""}

          <div class="signature-section">
            <div class="signature-box">
              <p>${invoice.signatureLocation}, ${formatDateIndonesian(invoice.issueDate)}</p>
              <div class="signature-space"></div>
              <div class="signature-name">${invoice.signatureName}</div>
            </div>
          </div>

          <div class="footer">
            <img src="/img-big.png" alt="Logo">
            <div class="footer-text">
              <p>Jl. Trenggono D.21 Peruri Kavling Brawijaya Asri, Linkungan Brawijaya, Kel.</p>
              <p>Kebalenan, Kec. Banyuwangi, Kab. Banyuwangi, Prov. Jawa Timur 68417</p>
              <p>Tlp: 0813-5892-2199 / 0813-3457-5487</p>
            </div>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
          <p className="text-gray-600 mt-1">PT. Banana 88 - Anugrah Perkasa</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Label htmlFor="dpAmount">DP (Down Payment)</Label>
                  <Input
                    id="dpAmount"
                    type="number"
                    min="0"
                    step="1000"
                    value={invoice.dpAmount}
                    onChange={(e) => updateInvoice("dpAmount", Number(e.target.value) || 0)}
                    placeholder="0"
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
                    onChange={(e) => updateInvoice("ppnRate", Number(e.target.value) || 0)}
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
                    onChange={(e) => updateInvoice("pphRate", Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

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
                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", Number(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.days}
                            onChange={(e) => updateItem(index, "days", Number(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(calculateItemTotal(item))}
                        </td>
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

              <div className="mt-6 flex justify-end">
                <div className="w-full md:w-80 bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {invoice.dpAmount > 0 && (
                    <div className="flex justify-between">
                      <span>DP:</span>
                      <span className="font-medium">{formatCurrency(invoice.dpAmount)}</span>
                    </div>
                  )}
                  {invoice.ppnRate > 0 && (
                    <div className="flex justify-between">
                      <span>PPN ({invoice.ppnRate}%):</span>
                      <span className="font-medium">{formatCurrency(totals.ppnAmount)}</span>
                    </div>
                  )}
                  {invoice.pphRate > 0 && (
                    <div className="flex justify-between">
                      <span>PPH ({invoice.pphRate}%):</span>
                      <span className="font-medium">{formatCurrency(totals.pphAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-foreground">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={invoice.notes}
                onChange={(e) => updateInvoice("notes", e.target.value)}
                placeholder="Catatan tambahan untuk pelanggan..."
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembayaran & Tanda Tangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signatureLocation">Lokasi Tanda Tangan</Label>
                  <Input
                    id="signatureLocation"
                    value={invoice.signatureLocation}
                    onChange={(e) => updateInvoice("signatureLocation", e.target.value)}
                    placeholder="Banyuwangi"
                  />
                </div>
                <div>
                  <Label htmlFor="signatureName">Nama Penandatangan</Label>
                  <Input
                    id="signatureName"
                    value={invoice.signatureName}
                    onChange={(e) => updateInvoice("signatureName", e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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