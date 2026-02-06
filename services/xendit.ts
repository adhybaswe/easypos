import { useConfigStore } from '@/stores/useConfigStore';

export interface XenditInvoiceRequest {
    external_id: string;
    amount: number;
    description: string;
    customer_email?: string;
    payment_methods?: string[];
    success_redirect_url?: string;
    failure_redirect_url?: string;
}

export interface XenditInvoiceResponse {
    id: string;
    invoice_url: string;
    status: string;
    external_id: string;
}

export interface XenditQRCodeResponse {
    id: string;
    external_id: string;
    qr_string: string;
    status: string;
    amount: number;
}

const getAuthHeader = () => {
    const { xenditConfig } = useConfigStore.getState();
    if (!xenditConfig?.secretKey) {
        throw new Error("Xendit Secret Key is missing. Please configure it in Setup.");
    }

    // Xendit requires Basic Auth: base64(secret_key + ":")
    const authString = `${xenditConfig.secretKey}:`;

    // Simple base64 encode for React Native / Web fallback
    let encodedAuth;
    try {
        encodedAuth = btoa(authString);
    } catch (e) {
        // Fallback for environments where btoa is missing but Buffer is present
        encodedAuth = Buffer.from(authString).toString('base64');
    }

    return `Basic ${encodedAuth}`;
};

export const createXenditInvoice = async (request: XenditInvoiceRequest): Promise<XenditInvoiceResponse> => {
    try {
        const response = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify({
                external_id: request.external_id,
                amount: request.amount,
                description: request.description,
                customer_email: request.customer_email,
                currency: 'IDR',
                payment_methods: request.payment_methods || ['QRIS'],
                success_redirect_url: request.success_redirect_url,
                failure_redirect_url: request.failure_redirect_url,
                reminder_control: {
                    send_sms: true,
                    send_email: true
                }
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create Xendit invoice');
        }

        return data;
    } catch (error: any) {
        console.error("Xendit Error:", error);
        throw error;
    }
};

export const getXenditInvoice = async (invoiceId: string): Promise<XenditInvoiceResponse> => {
    try {
        const response = await fetch(`https://api.xendit.co/v2/invoices/${invoiceId}`, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader(),
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch Xendit invoice');
        }

        return data;
    } catch (error: any) {
        console.error("Xendit Status Error:", error);
        throw error;
    }
};

export const createXenditQRCode = async (externalId: string, amount: number): Promise<XenditQRCodeResponse> => {
    try {
        const { xenditConfig } = useConfigStore.getState();
        const roundedAmount = Math.floor(amount);

        // Buat ID unik khusus untuk QR agar tidak konflik dengan Invoice lama
        const uniqueQrId = `qr_${externalId}_${Date.now()}`;

        const response = await fetch('https://api.xendit.co/qr_codes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify({
                external_id: uniqueQrId,
                type: 'DYNAMIC',
                amount: roundedAmount,
                currency: 'IDR',
                callback_url: xenditConfig?.webhookUrl || 'https://mtmitpvpainxcvyortwb.supabase.co/functions/v1/webhooh-xendit'
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Xendit Validation Error:", data);
            // Ambil pesan detail dari array errors jika ada
            let detailedError = data.message || 'Validation Error';
            if (data.errors && Array.isArray(data.errors)) {
                detailedError = data.errors.map((e: any) => `${e.path}: ${e.message}`).join(', ');
            } else if (data.errors) {
                detailedError = JSON.stringify(data.errors);
            }
            throw new Error(detailedError);
        }

        // Log simulasi untuk Postman/Terminal
        console.log("--- XENDIT QR SIMULATION ---");
        console.log(`External ID (For Simulation): ${uniqueQrId}`);
        console.log(`CURL Command:`);
        console.log(`curl -X POST 'https://api.xendit.co/qr_codes/${uniqueQrId}/payments/simulate' -u '${xenditConfig?.secretKey}:'`);
        console.log("----------------------------");

        return data;
    } catch (error: any) {
        console.error("Xendit QR Service Error:", error);
        throw error;
    }
};

export const getXenditQRCode = async (qrId: string): Promise<XenditQRCodeResponse> => {
    try {
        const response = await fetch(`https://api.xendit.co/qr_codes/${qrId}`, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader(),
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch QR Code status');
        }

        return data;
    } catch (error: any) {
        console.error("Xendit QR Status Error:", error);
        throw error;
    }
};
