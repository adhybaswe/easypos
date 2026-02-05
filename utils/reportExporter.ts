import { Transaction, User } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const exportToCSV = async (transactions: Transaction[], users: User[]) => {
    try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            throw new Error('Sharing is not available on this device');
        }

        let csvContent = '"Transaction ID","Date","Time","Cashier","Total Amount"\n';

        transactions.forEach(tx => {
            const dateObj = new Date(tx.created_at);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString();
            const cashier = users.find(u => u.id === tx.user_id)?.username || 'Unknown';

            const safeCashier = cashier.replace(/"/g, '""');
            csvContent += `"${tx.id}","${dateStr}","${timeStr}","${safeCashier}","${tx.total_amount}"\n`;
        });

        const fileName = `easypos_report_${Date.now()}.csv`;
        // Ensure we are using the legacy cacheDirectory
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;

        // Use the legacy writeAsStringAsync
        await FileSystem.writeAsStringAsync(filePath, csvContent, {
            encoding: 'utf8',
        });

        await Sharing.shareAsync(filePath, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Laporan CSV',
        });
    } catch (error) {
        console.error('CSV Export Error:', error);
        throw error;
    }
};

export const exportToPDF = async (transactions: Transaction[], users: User[]) => {
    try {
        const rows = transactions.map(tx => {
            const dateObj = new Date(tx.created_at);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString();
            const cashier = users.find(u => u.id === tx.user_id)?.username || 'Unknown';
            return `
                <tr>
                    <td>${tx.id.slice(-6)}</td>
                    <td>${dateStr} ${timeStr}</td>
                    <td>${cashier}</td>
                    <td style="text-align: right;">${formatCurrency(tx.total_amount)}</td>
                </tr>
            `;
        }).join('');

        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                    h1 { color: #4F46E5; margin-bottom: 5px; }
                    .header { border-bottom: 2px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
                    .summary { display: flex; justify-content: space-between; margin-bottom: 20px; background: #F3F4F6; padding: 15px; borderRadius: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; background-color: #4F46E5; color: white; padding: 12px; }
                    td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
                    .footer { margin-top: 30px; text-align: center; color: #9CA3AF; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Penjualan EasyPOS</h1>
                    <p>Tanggal Cetak: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="summary">
                    <div>
                        <p style="margin: 0; color: #6B7280;">Total Transaksi</p>
                        <p style="margin: 0; font-size: 20px; font-weight: bold;">${transactions.length}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; color: #6B7280;">Total Pendapatan</p>
                        <p style="margin: 0; font-size: 20px; font-weight: bold; color: #16A34A;">${formatCurrency(totalRevenue)}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID (Last 6)</th>
                            <th>Waktu</th>
                            <th>Kasir</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="footer">
                    <p>EasyPOS - Modern Point of Sale Solution</p>
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export PDF Report',
            UTI: 'com.adobe.pdf'
        });
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw error;
    }
};
