// --- STATE ---
let users = [];         // The Pool
let mainUserId = null;  // The Owner
let assignedKeys = [];  // List of IDs for Speed Dials
let currentPage = 1;
let userModal = null;   // Bootstrap Modal Instance

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Init Modal (Make sure the modal HTML exists in your page!)
    const modalEl = document.getElementById('userModal');
    if (modalEl) {
        userModal = new bootstrap.Modal(modalEl);
    }

    // 2. Init SortableJS
    const sortableList = document.getElementById('assignedKeysList');
    if (sortableList) {
        new Sortable(sortableList, {
            animation: 150,
            ghostClass: 'bg-light',
            onEnd: function (evt) {
                const item = assignedKeys.splice(evt.oldIndex, 1)[0];
                assignedKeys.splice(evt.newIndex, 0, item);
                renderPreview();
            }
        });
    }

    // 3. Populate dummy data if empty
    if(users.length === 0) {
        users = [
            { id: 1, name: "Reception", ext: "100", password: "123" },
            { id: 2, name: "John Doe", ext: "101", password: "123" },
            { id: 3, name: "Jane Smith", ext: "102", password: "123" },
            { id: 4, name: "Meeting Room", ext: "103", password: "123" }
        ];
    }
    
    // 4. Initial Renders
    renderTable(); 
    renderButtons(); 
    startClock();
});

// ==========================================
//  PART 1: POOL MANAGER (CRUD & I/O)
// ==========================================

function renderTable() {
    const tbody = document.getElementById('userTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    if (users.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
        users.forEach(u => {
            tbody.innerHTML += `
            <tr>
                <td class="ps-4">
                    <input type="checkbox" class="user-checkbox" value="${u.id}" onchange="updateSelectedCount()">
                </td>
                <td class="fw-bold">${u.name}</td>
                <td><span class="badge bg-light text-dark border">${u.ext}</span></td>
                <td class="text-muted small">${u.password || '-'}</td>
                <td class="text-muted small">${u.label || '-'}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm text-primary me-1" onclick="editUser(${u.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm text-danger" onclick="deleteUser(${u.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        });
    }
    document.getElementById('userCount').innerText = users.length;
    updateSelectedCount();
}

function openModal(mode = 'add') {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('modalTitle').innerText = mode === 'add' ? "Add New User" : "Edit User";
    userModal.show();
}

function editUser(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    document.getElementById('userId').value = u.id;
    document.getElementById('userName').value = u.name;
    document.getElementById('userExt').value = u.ext;
    document.getElementById('userPass').value = u.password;
    document.getElementById('userLabel').value = u.label || "";
    openModal('edit');
}

function saveUser() {
    const idStr = document.getElementById('userId').value;
    const name = document.getElementById('userName').value;
    const ext = document.getElementById('userExt').value;
    const password = document.getElementById('userPass').value;
    const label = document.getElementById('userLabel').value;

    if (!name || !ext) { alert("Name and Ext required"); return; }

    if (idStr) {
        // Edit
        const idx = users.findIndex(u => u.id == idStr);
        if (idx !== -1) {
            users[idx] = { ...users[idx], name, ext, password, label };
        }
    } else {
        // Create
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({ id: newId, name, ext, password, label });
    }

    userModal.hide();
    renderTable();
    refreshConfigUI(); // Update the dropdowns in Tab 2
}

function deleteUser(id) {
    if(!confirm("Delete user?")) return;
    users = users.filter(u => u.id !== id);
    if(mainUserId === id) { mainUserId = null; document.getElementById('mainUserSelect').value = ""; }
    assignedKeys = assignedKeys.filter(kId => kId !== id);
    renderTable();
    refreshConfigUI();
}

// --- SELECT ALL FUNCTIONALITY ---
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');

    userCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });

    updateSelectedCount();
}

function updateSelectedCount() {
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectedCountSpan = document.getElementById('selectedCount');

    // Update the "select all" checkbox state
    if (checkedBoxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === userCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }

    // Show/hide delete button and update count
    if (checkedBoxes.length > 0) {
        deleteBtn.style.display = 'block';
        selectedCountSpan.innerText = checkedBoxes.length;
    } else {
        deleteBtn.style.display = 'none';
    }
}

function deleteSelected() {
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    if (idsToDelete.length === 0) return;

    const confirmMsg = `Delete ${idsToDelete.length} selected user(s)?`;
    if (!confirm(confirmMsg)) return;

    // Remove selected users
    users = users.filter(u => !idsToDelete.includes(u.id));

    // Clean up references
    if (idsToDelete.includes(mainUserId)) {
        mainUserId = null;
        const mainUserSelect = document.getElementById('mainUserSelect');
        if (mainUserSelect) mainUserSelect.value = "";
    }
    assignedKeys = assignedKeys.filter(kId => !idsToDelete.includes(kId));

    renderTable();
    refreshConfigUI();
}

// --- EXPORT FUNCTION ---
function exportUsers() {
    if (users.length === 0) { alert("Pool is empty."); return; }

    fetch('/export_pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: users })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "user_pool.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    })
    .catch(err => alert("Export failed."));
}

// --- IMPORT FUNCTION ---
function importUsers(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                if(confirm("Replace current pool with imported data?")) {
                    users = imported;
                    mainUserId = null;
                    assignedKeys = [];
                    renderTable();
                    refreshConfigUI();
                }
            } else {
                alert("Invalid JSON");
            }
        } catch (err) { alert("Error parsing JSON"); }
        input.value = ''; // Reset
    };
    reader.readAsText(file);
}


// ==========================================
//  PART 2: CONFIGURATOR LOGIC
// ==========================================

function refreshConfigUI() {
    const select = document.getElementById('mainUserSelect');
    if(!select) return; 

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select Owner --</option>';
    
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.text = `${u.name} (${u.ext})`;
        select.appendChild(opt);
    });
    
    select.value = currentVal;
    renderAssignedKeysList();
    renderPreview();
}

function setMainUser() {
    const val = document.getElementById('mainUserSelect').value;
    mainUserId = val ? parseInt(val) : null;
    
    const detailBox = document.getElementById('ownerDetails');
    
    if(mainUserId) {
        const u = users.find(x => x.id === mainUserId);
        detailBox.classList.remove('d-none');
        document.getElementById('ownerExt').innerText = u.ext;
        document.getElementById('ownerPass').innerText = u.password;
        
        // Remove Main User from assigned keys if they were there
        assignedKeys = assignedKeys.filter(id => id !== mainUserId);
    } else {
        detailBox.classList.add('d-none');
    }
    
    renderAssignedKeysList();
    renderPreview();
}

// --- KEY PICKER ---
function openKeyPicker() {
    if(!mainUserId) { alert("Please select a Phone Owner first."); return; }

    const list = document.getElementById('pickerList');
    list.innerHTML = '';

    // Filter: Users who are NOT the main user AND NOT already assigned
    const available = users.filter(u => u.id !== mainUserId && !assignedKeys.includes(u.id));

    available.forEach(u => {
        list.innerHTML += `
        <label class="list-group-item">
            <input class="form-check-input me-2 key-checkbox" type="checkbox" value="${u.id}" onchange="updateKeyPickerSelectAll()">
            ${u.name} <span class="text-muted small">(${u.ext})</span>
        </label>`;
    });

    // Reset the "select all" checkbox
    const selectAllCheckbox = document.getElementById('selectAllKeysCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }

    new bootstrap.Modal(document.getElementById('keyPickerModal')).show();
}

function toggleSelectAllKeys() {
    const selectAllCheckbox = document.getElementById('selectAllKeysCheckbox');
    const keyCheckboxes = document.querySelectorAll('.key-checkbox');

    keyCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function updateKeyPickerSelectAll() {
    const keyCheckboxes = document.querySelectorAll('.key-checkbox');
    const checkedBoxes = document.querySelectorAll('.key-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAllKeysCheckbox');

    if (!selectAllCheckbox) return;

    // Update the "select all" checkbox state
    if (checkedBoxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === keyCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function confirmAddKeys() {
    const checked = document.querySelectorAll('.key-checkbox:checked');
    checked.forEach(box => {
        assignedKeys.push(parseInt(box.value));
    });
    
    // Close Modal
    bootstrap.Modal.getInstance(document.getElementById('keyPickerModal')).hide();
    renderAssignedKeysList();
    renderPreview();
}

function removeKey(id) {
    assignedKeys = assignedKeys.filter(k => k !== id);
    renderAssignedKeysList();
    renderPreview();
}

function renderAssignedKeysList() {
    const list = document.getElementById('assignedKeysList');
    const empty = document.getElementById('keysEmpty');
    list.innerHTML = '';
    
    if(assignedKeys.length === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        assignedKeys.forEach(id => {
            const u = users.find(x => x.id === id);
            if(!u) return;
            
            list.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center" style="cursor: move;">
                <div>
                    <i class="bi bi-grip-vertical text-muted me-2"></i>
                    ${u.name}
                </div>
                <button class="btn btn-sm text-danger py-0" onclick="removeKey(${u.id})">×</button>
            </li>`;
        });
    }
}

// ==========================================
//  PART 3: PREVIEW ENGINE
// ==========================================

function renderPreview() {
    const left = document.getElementById('previewLeft');
    const right = document.getElementById('previewRight');
    if(!left || !right) return;

    left.innerHTML = ''; right.innerHTML = '';
    
    const slots = [];
    
    // 1. Line Key
    if(mainUserId && currentPage === 1) {
        const owner = users.find(u => u.id === mainUserId);
        slots.push({ label: owner.name, type: 'line', icon: 'bi-telephone-fill' });
    } else if (currentPage === 1) {
        slots.push({ label: "No User", type: 'empty' });
    }

    // 2. Fill remaining slots
    let keysStartIndex = 0;
    let slotsAvailable = 0;
    
    if(currentPage === 1) {
        slotsAvailable = 11; 
        keysStartIndex = 0;
    } else {
        slotsAvailable = 12;
        keysStartIndex = 11 + ((currentPage - 2) * 12); 
    }
    
    const pageKeysIDs = assignedKeys.slice(keysStartIndex, keysStartIndex + slotsAvailable);
    
    pageKeysIDs.forEach(id => {
        const u = users.find(x => x.id === id);
        slots.push({ label: u.name, type: 'blf', icon: 'bi-person-fill' });
    });
    
    while(slots.length < 12) {
        slots.push({ label: '', type: 'empty' });
    }

    for(let i=0; i<6; i++) left.innerHTML += createKeyHTML(slots[i], false);
    for(let i=6; i<12; i++) right.innerHTML += createKeyHTML(slots[i], true);
    
    const owner = users.find(u => u.id === mainUserId);
    const headerLeft = document.getElementById('headerLeft');
    if(headerLeft) headerLeft.innerHTML = owner ? `<span>${owner.ext}</span>` : '<span>--</span>';
    
    document.getElementById('pgInfo').innerText = `Page ${currentPage}`;
    
    const dotsContainer = document.getElementById('pgDots');
    if(dotsContainer) {
        dotsContainer.innerHTML = '';
        for(let i=1; i<=4; i++) {
            dotsContainer.innerHTML += `<div class="pg-sq ${i===currentPage ? 'active':''}"></div>`;
        }
    }
}

function createKeyHTML(slot, isRight) {
    let iconClass = 'icon-empty';
    if(slot.type === 'line') iconClass = 'icon-green';
    if(slot.type === 'blf') iconClass = 'icon-blue';
    
    const content = slot.type !== 'empty' ? `<i class="bi ${slot.icon}"></i>` : '';
    return `
    <div class="d-key ${isRight ? 'right':''}">
        <div class="key-icon ${iconClass}">${content}</div>
        <span class="text-truncate">${slot.label}</span>
    </div>`;
}

function changePage(d) {
    currentPage += d;
    if(currentPage < 1) currentPage = 1;
    if(currentPage > 4) currentPage = 4;
    renderPreview();
}

function renderButtons() {
    const html = `<div class="p-btn-group"><div class="p-led"></div><div class="p-btn"></div></div>`.repeat(6);
    const bl = document.getElementById('pbtn-left');
    const br = document.getElementById('pbtn-right');
    if(bl) bl.innerHTML = html;
    if(br) br.innerHTML = html;
}

function startClock() {
    setInterval(() => {
        const d = new Date();
        const el = document.getElementById('liveClock');
        if(el) el.innerText = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }, 1000);
}

// --- GENERATE ---
function generateConfig() {
    if(!mainUserId) { alert("Select a Main User first."); return; }
    
    const owner = users.find(u => u.id === mainUserId);
    const blfList = assignedKeys.map(id => users.find(u => u.id === id));
    
    const payload = {
        server_config: {
            ip: document.getElementById('cfgServerIP').value,
            port: document.getElementById('cfgServerPort').value,
            ntp_server: "pool.ntp.org"
        },
        user_config: owner,
        attendants: blfList
    };
    
    fetch('/generate', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${owner.ext}.cfg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    })
    .catch(err => alert("Generation failed"));
}