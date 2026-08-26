// js/db.js

let pendingAction = null;

// Modal Helpers
function openCustomModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    if (document.getElementById('modalTitle')) document.getElementById('modalTitle').innerText = title;
    if (document.getElementById('modalMessage')) document.getElementById('modalMessage').innerText = message;
    pendingAction = onConfirm;
    if (modal) modal.style.display = 'flex';
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.style.display = 'none';
    pendingAction = null;
}

function executeModalAction() {
    if (typeof pendingAction === 'function') pendingAction();
    closeConfirmationModal();
}

// Get User & Family Profile Context
async function getCurrentUserFamilyProfile() {
    if (!_supabase) return null;
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return null;

        const { data: profile, error } = await _supabase
            .from('profiles')
            .select('*, families(id, name, invite_code)')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return profile;
    } catch (err) {
        console.error("Error fetching family profile:", err);
        return null;
    }
}

// Populate Category Dropdowns for Family
async function populateCategoryDropdown() {
    if (!_supabase) return;

    try {
        const profile = await getCurrentUserFamilyProfile();
        if (!profile?.family_id) return;

        const { data: categories, error } = await _supabase
            .from('categories')
            .select('name')
            .eq('family_id', profile.family_id)
            .order('name', { ascending: true });

        if (error) throw error;

        const expSelect = document.getElementById('expCategory');
        if (expSelect) {
            const val = expSelect.value;
            expSelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
            (categories || []).forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.name;
                opt.textContent = cat.name;
                expSelect.appendChild(opt);
            });
            if (val) expSelect.value = val;
        }

        const filterSelect = document.getElementById('categoryFilter');
        if (filterSelect) {
            const val = filterSelect.value;
            filterSelect.innerHTML = '<option value="All">All Categories</option>';
            (categories || []).forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.name;
                opt.textContent = cat.name;
                filterSelect.appendChild(opt);
            });
            filterSelect.value = val || 'All';
        }
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}

// Category Actions
function promptAddCategory() {
    const modal = document.getElementById('addCategoryModal');
    const input = document.getElementById('modalCategoryInput');
    if (input) input.value = '';
    if (modal) modal.style.display = 'flex';
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) modal.style.display = 'none';
}

async function submitNewCategory() {
    if (!_supabase) return;
    const input = document.getElementById('modalCategoryInput');
    const categoryName = input?.value.trim();

    if (!categoryName) {
        if (typeof showToast === 'function') showToast("Please enter a category name.");
        return;
    }

    try {
        const profile = await getCurrentUserFamilyProfile();
        if (!profile?.family_id) throw new Error("No family linked.");

        const { error } = await _supabase
            .from('categories')
            .insert([{ name: categoryName, family_id: profile.family_id }]);

        if (error) throw error;

        if (typeof showToast === 'function') showToast(`Category "${categoryName}" created!`);
        closeAddCategoryModal();
        await populateCategoryDropdown();
    } catch (err) {
        if (typeof showToast === 'function') showToast('Failed: ' + err.message);
    }
}

async function confirmDeleteSelectedCategory() {
    const filterSelect = document.getElementById('categoryFilter');
    const formSelect = document.getElementById('expCategory');
    let categoryName = filterSelect?.value !== 'All' ? filterSelect?.value : formSelect?.value;

    if (!categoryName || categoryName === 'All') {
        if (typeof showToast === 'function') showToast('Select a valid category to delete.');
        return;
    }

    openCustomModal("Delete Category", `Delete category "${categoryName}" for the entire family?`, async () => {
        try {
            const profile = await getCurrentUserFamilyProfile();
            const { error } = await _supabase
                .from('categories').delete().eq('name', categoryName).eq('family_id', profile.family_id);

            if (error) throw error;
            if (typeof showToast === 'function') showToast(`Category "${categoryName}" deleted!`);
            await populateCategoryDropdown();
            await loadDashboardData();
        } catch (err) {
            if (typeof showToast === 'function') showToast('Delete failed: ' + err.message);
        }
    });
}

let editingCategoryName = null;

function promptEditCategory() {
    const filterSelect = document.getElementById('categoryFilter');
    const formSelect = document.getElementById('expCategory');
    let categoryName = filterSelect?.value !== 'All' ? filterSelect?.value : formSelect?.value;

    if (!categoryName || categoryName === 'All') {
        if (typeof showToast === 'function') showToast('Select a valid category to edit.');
        return;
    }

    editingCategoryName = categoryName;
    const input = document.getElementById('editCategoryInput');
    if (input) input.value = categoryName;
    const modal = document.getElementById('editCategoryModal');
    if (modal) modal.style.display = 'flex';
}

function closeEditCategoryModal() {
    const modal = document.getElementById('editCategoryModal');
    if (modal) modal.style.display = 'none';
    editingCategoryName = null;
}

async function submitEditCategory() {
    if (!_supabase) return;
    const input = document.getElementById('editCategoryInput');
    const newName = input?.value.trim();

    if (!newName) {
        if (typeof showToast === 'function') showToast("Please enter a category name.");
        return;
    }

    if (newName === editingCategoryName) {
        closeEditCategoryModal();
        return;
    }

    try {
        const profile = await getCurrentUserFamilyProfile();
        if (!profile?.family_id) throw new Error("No family linked.");

        const { error } = await _supabase
            .from('categories')
            .update({ name: newName })
            .eq('name', editingCategoryName)
            .eq('family_id', profile.family_id);

        if (error) throw error;

        const { error: expenseError } = await _supabase
            .from('expenses')
            .update({ category: newName })
            .eq('category', editingCategoryName)
            .eq('family_id', profile.family_id);

        if (expenseError) throw expenseError;

        if (typeof showToast === 'function') showToast(`Category renamed to "${newName}"!`);
        closeEditCategoryModal();
        await populateCategoryDropdown();
        await loadDashboardData();
    } catch (err) {
        if (typeof showToast === 'function') showToast('Rename failed: ' + err.message);
    }
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
}

async function promptEditProfile() {
    if (!_supabase) return;
    try {
        const profile = await getCurrentUserFamilyProfile();
        if (!profile) throw new Error("No profile found.");

        const nameEl = document.getElementById('editFullNameInput');
        if (nameEl) nameEl.value = profile.full_name || '';

        const familyEl = document.getElementById('editFamilyNameInput');
        if (familyEl && profile.families) familyEl.value = profile.families.name || '';

        const modal = document.getElementById('editProfileModal');
        if (modal) modal.style.display = 'flex';
    } catch (err) {
        if (typeof showToast === 'function') showToast('Could not load profile: ' + err.message);
    }
}

async function submitEditProfile() {
    if (!_supabase) return;

    const fullName = document.getElementById('editFullNameInput')?.value.trim();
    const familyName = document.getElementById('editFamilyNameInput')?.value.trim();

    if (!fullName || !familyName) {
        if (typeof showToast === 'function') showToast('Please fill in both your name and family name.');
        return;
    }

    try {
        const profile = await getCurrentUserFamilyProfile();
        if (!profile?.id) throw new Error("No profile found.");
        if (!profile?.families?.id) throw new Error("No family linked.");

        const profileRes = await _supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', profile.id);

        if (profileRes.error) throw profileRes.error;

        const familyRes = await _supabase
            .from('families')
            .update({ name: familyName })
            .eq('id', profile.families.id);

        if (familyRes.error) throw familyRes.error;

        // Keep auth user_metadata in sync so the displayed name updates everywhere.
        const { error: metaError } = await _supabase.auth.updateUser({ data: { full_name: fullName } });
        if (metaError) throw metaError;

        if (typeof showToast === 'function') showToast('Profile updated!');
        closeEditProfileModal();
        await loadDashboardData();

        const { data } = await _supabase.auth.getUser();
        if (typeof updateNavAuthUI === 'function') updateNavAuthUI(data?.user || null);
    } catch (err) {
        if (typeof showToast === 'function') showToast('Update failed: ' + err.message);
    }
}

// Add Expense Handler
async function addExpense(event) {
    if (event) event.preventDefault();
    if (!_supabase) return;

    const profile = await getCurrentUserFamilyProfile();
    if (!profile?.family_id) {
        if (typeof showToast === 'function') showToast("You are not currently linked to a family.");
        return;
    }

    const category = document.getElementById('expCategory')?.value;
    const amountInput = document.getElementById('expAmount');
    const amount = parseFloat(amountInput?.value);
    const date = document.getElementById('expDate')?.value;
    const description = document.getElementById('expDescription')?.value || '';

    if (!category || isNaN(amount) || amount <= 0 || !date) {
        if (typeof showToast === 'function') showToast("Please fill in valid expense details.");
        return;
    }

    try {
        const { error } = await _supabase.from('expenses').insert([{
            family_id: profile.family_id,
            user_id: profile.id,
            category, amount, date, description
        }]);

        if (error) throw error;

        if (typeof showToast === 'function') showToast("Shared expense added!");
        if (amountInput) amountInput.value = '';
        if (document.getElementById('expDescription')) document.getElementById('expDescription').value = '';

        await loadDashboardData();
    } catch (err) {
        if (typeof showToast === 'function') showToast(`Failed: ${err.message}`);
    }
}

// Load & Render Dashboard Ledger
// js/db.js - Load & Render Dashboard Ledger

async function loadDashboardData() {
    if (!_supabase) return;

    try {
        const profile = await getCurrentUserFamilyProfile();
        if (!profile?.family_id) {
            renderFamilyExpenseList([]);
            return;
        }

        const dateFilter = document.getElementById('ledgerDateFilter')?.value;
        const catFilter = document.getElementById('categoryFilter')?.value;

        // Fetch expenses joined with profiles (full_name and email)
        let query = _supabase
            .from('expenses')
            .select('id, category, amount, date, description, family_id, user_id, profiles(full_name, email)')
            .eq('family_id', profile.family_id)
            .order('date', { ascending: false });

        if (dateFilter) query = query.eq('date', dateFilter);
        if (catFilter && catFilter !== 'All') query = query.eq('category', catFilter);

        const { data: expenses, error } = await query;

        if (error) {
            console.error('Supabase Query Error:', error);
            throw error;
        }

        renderFamilyExpenseList(expenses || []);
    } catch (err) {
        console.error('Error loading expenses:', err);
    }
}

function renderFamilyExpenseList(expenses) {
    const container = document.getElementById('expenseList');
    const totalEl = document.getElementById('totalSpent');

    if (!container) return;
    container.innerHTML = '';
    let total = 0;

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No family transactions found.</div>';
    } else {
        // js/db.js - inside renderFamilyExpenseList(expenses)

        expenses.forEach(exp => {
            const expAmt = parseFloat(exp.amount || 0);
            total += expAmt;

            // Safely extract the profile name of whoever logged the expense
            let paidByName = 'Member';

            if (exp.profiles) {
                if (exp.profiles.full_name && exp.profiles.full_name.trim() !== '') {
                    paidByName = exp.profiles.full_name;
                } else if (exp.profiles.email) {
                    paidByName = exp.profiles.email.split('@')[0]; // Extract username before @
                }
            }

            const row = document.createElement('div');
            row.className = 'expense-item flex justify-between items-center p-3 border-b';
            row.innerHTML = `
        <div>
            <div style="font-weight: 600; color: var(--text-main);">${exp.category}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${exp.date} &bull; Paid by <strong style="color: var(--emerald);">${paidByName}</strong>
                ${exp.description ? ` (${exp.description})` : ''}
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-weight: 700; color: var(--text-main);">Rs. ${expAmt.toFixed(2)}</span>
            <button class="edit-btn" onclick="promptEditExpense(${exp.id})" title="Edit">✎</button>
            <button class="delete-btn" onclick="deleteExpense(${exp.id})">&times;</button>
        </div>
    `;
            container.appendChild(row);
        });
    }

    if (totalEl) totalEl.innerText = total.toFixed(2);
}

async function deleteExpense(expenseId) {
    openCustomModal("Delete Expense", "Delete this record from family ledger?", async () => {
        try {
            const { error } = await _supabase.from('expenses').delete().eq('id', expenseId);
            if (error) throw error;
            if (typeof showToast === 'function') showToast('Expense deleted!');
            await loadDashboardData();
        } catch (err) {
            if (typeof showToast === 'function') showToast('Delete failed: ' + err.message);
        }
    });
}

let editingExpenseId = null;

async function promptEditExpense(expenseId) {
    if (!_supabase) return;

    try {
        const { data, error } = await _supabase
            .from('expenses')
            .select('id, category, amount, date, description')
            .eq('id', expenseId)
            .single();

        if (error) throw error;

        editingExpenseId = expenseId;

        const profile = await getCurrentUserFamilyProfile();
        if (profile?.family_id) {
            const { data: categories, error: catError } = await _supabase
                .from('categories')
                .select('name')
                .eq('family_id', profile.family_id)
                .order('name', { ascending: true });

            if (!catError) {
                const select = document.getElementById('editExpCategory');
                if (select) {
                    select.innerHTML = '';
                    (categories || []).forEach(cat => {
                        const opt = document.createElement('option');
                        opt.value = cat.name;
                        opt.textContent = cat.name;
                        select.appendChild(opt);
                    });
                }
            }
        }

        const catEl = document.getElementById('editExpCategory');
        const dateEl = document.getElementById('editExpDate');
        const amountEl = document.getElementById('editExpAmount');
        const descEl = document.getElementById('editExpDescription');

        if (catEl) catEl.value = data.category;
        if (dateEl) dateEl.value = data.date;
        if (amountEl) amountEl.value = data.amount;
        if (descEl) descEl.value = data.description || '';

        const modal = document.getElementById('editExpenseModal');
        if (modal) modal.style.display = 'flex';
    } catch (err) {
        if (typeof showToast === 'function') showToast('Could not load expense: ' + err.message);
    }
}

function closeEditExpenseModal() {
    const modal = document.getElementById('editExpenseModal');
    if (modal) modal.style.display = 'none';
    editingExpenseId = null;
}

async function submitEditExpense() {
    if (!_supabase) return;
    if (editingExpenseId == null) return;

    const category = document.getElementById('editExpCategory')?.value;
    const amount = parseFloat(document.getElementById('editExpAmount')?.value);
    const date = document.getElementById('editExpDate')?.value;
    const description = document.getElementById('editExpDescription')?.value || '';

    if (!category || isNaN(amount) || amount <= 0 || !date) {
        if (typeof showToast === 'function') showToast("Please fill in valid expense details.");
        return;
    }

    try {
        const { error } = await _supabase
            .from('expenses')
            .update({ category, amount, date, description })
            .eq('id', editingExpenseId);

        if (error) throw error;

        if (typeof showToast === 'function') showToast("Transaction updated!");
        closeEditExpenseModal();
        await loadDashboardData();
    } catch (err) {
        if (typeof showToast === 'function') showToast('Update failed: ' + err.message);
    }
}

// Global Bindings
window.getCurrentUserFamilyProfile = getCurrentUserFamilyProfile;
window.populateCategoryDropdown = populateCategoryDropdown;
window.promptAddCategory = promptAddCategory;
window.closeAddCategoryModal = closeAddCategoryModal;
window.submitNewCategory = submitNewCategory;
window.confirmDeleteSelectedCategory = confirmDeleteSelectedCategory;
window.promptEditCategory = promptEditCategory;
window.closeEditCategoryModal = closeEditCategoryModal;
window.submitEditCategory = submitEditCategory;
window.addExpense = addExpense;
window.deleteExpense = deleteExpense;
window.promptEditExpense = promptEditExpense;
window.closeEditExpenseModal = closeEditExpenseModal;
window.submitEditExpense = submitEditExpense;
window.promptEditProfile = promptEditProfile;
window.closeEditProfileModal = closeEditProfileModal;
window.submitEditProfile = submitEditProfile;
window.loadDashboardData = loadDashboardData;
window.openCustomModal = openCustomModal;
window.closeConfirmationModal = closeConfirmationModal;
window.executeModalAction = executeModalAction;