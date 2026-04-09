/**
 * TenderX Solutions - Supabase Core Logic
 */

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://qksvtmzwnmyvsbornnev.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Kzlqn7j9TGOi0wGSNFtE7A_zn-UGjcV';

let supabaseClient = null;

// Initialize Supabase Client Immediately if possible
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Initialized");
        return supabaseClient;
    }
    return null;
}

// Function definitions are global
window.loginAdmin = async function(email, password) {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) throw new Error("Supabase library not loaded. Check your internet connection.");
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

window.logoutAdmin = async function() {
    if (!supabaseClient) initSupabase();
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = '../admin/login.html';
};

window.checkSession = async function() {
    if (!supabaseClient) initSupabase();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '../admin/login.html';
    }
    return session;
};

window.submitTenderForm = async function(formData, fileInput) {
    if (!supabaseClient) initSupabase();
    try {
        let uploadedPaths = [];
        if (fileInput && fileInput.files.length > 0) {
            for (const file of fileInput.files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `submissions/${fileName}`;
                const { data, error: uploadError } = await supabaseClient.storage.from('tender-documents').upload(filePath, file);
                if (uploadError) throw uploadError;
                uploadedPaths.push(filePath);
            }
        }

        const { data, error } = await supabaseClient.from('submissions').insert([{
            contractor_name: formData.get('contractorName'),
            company_name: formData.get('companyName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            tender_name: formData.get('tenderName'),
            department: formData.get('department'),
            tender_id: formData.get('tenderId'),
            bid_percentage: parseFloat(formData.get('bidPercentage')),
            gst_details: formData.get('gstDetails'),
            dsc_details: JSON.stringify({
                type: formData.get('dscTokenType'),
                info: formData.get('dscDetails')
            }),
            document_paths: uploadedPaths,
            status: 'pending'
        }]);
        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

window.fetchSubmissions = async function() {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient.from('submissions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

window.updateSubmissionStatus = async function(id, status) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient.from('submissions').update({ status }).eq('id', id);
    if (error) throw error;
    return data;
};

window.deleteSubmission = async function(id) {
    if (!supabaseClient) initSupabase();
    const { error } = await supabaseClient.from('submissions').delete().eq('id', id);
    if (error) throw error;
};

window.getFileUrl = function(path) {
    if (!supabaseClient) initSupabase();
    const { data } = supabaseClient.storage.from('tender-documents').getPublicUrl(path);
    return data.publicUrl;
};

// Auto-init on load if the library is ready
if (typeof window.supabase !== 'undefined') {
    initSupabase();
} else {
    // Or wait for it
    document.addEventListener('DOMContentLoaded', initSupabase);
}
