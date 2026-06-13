document.addEventListener("DOMContentLoaded", function () {

    // ─── 1. إدارة المظهر والـ Dark Mode ───
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButtonText(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeButtonText(newTheme);
        updateDashboardUI();
    });

    function updateThemeButtonText(theme) {
        themeToggleBtn.innerText = theme === "dark" ? "☀️ المظهر الفاتح" : "🌙 المظهر الداكن";
    }

    // ─── 2. عناصر التنقل والقوائم ───
    const menuHome = document.getElementById("menu-home");
    const menuEditor = document.getElementById("menu-editor");
    const menuAllTasks = document.getElementById("menu-all-tasks");

    const sectionHome = document.getElementById("section-home");
    const sectionEditor = document.getElementById("section-editor");
    const sectionAllTasks = document.getElementById("section-all-tasks");

    const dashStartDate = document.getElementById("dash-start-date");
    const dashEndDate = document.getElementById("dash-end-date");
    const resetFilterBtn = document.getElementById("reset-filter-btn");

    const taskInput = document.getElementById("task-input");
    const taskDate = document.getElementById("task-date");
    const taskDuration = document.getElementById("task-duration");
    const saveTaskBtn = document.getElementById("save-task-btn");
    const successAlert = document.getElementById("success-alert");
    const filterDateInput = document.getElementById("filter-date-input");
    const editorTasksTbody = document.getElementById("editor-tasks-tbody");
    const noTasksMsg = document.getElementById("no-tasks-msg");
    const weeklyTasksTbody = document.getElementById("weekly-tasks-tbody");

    const timelineContainer = document.getElementById("timeline-container");
    const todayTasksList = document.getElementById("today-tasks-list");
    const todayDateDisplay = document.getElementById("today-date-display");

    // عناصر الـ Modals
    const editModal = document.getElementById("edit-modal");
    const editTaskId = document.getElementById("edit-task-id");
    const editTaskInput = document.getElementById("edit-task-input");
    const editTaskDate = document.getElementById("edit-task-date");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cancelModalBtn = document.getElementById("cancel-modal-btn");
    const updateTaskBtn = document.getElementById("update-task-btn");

    const errorModal = document.getElementById("error-modal");
    const closeErrorBtn = document.getElementById("close-error-btn");
    const okErrorBtn = document.getElementById("ok-error-btn");

    // عناصر الإحصائيات
    const statPlanned = document.getElementById("stat-planned");
    const statCompleted = document.getElementById("stat-completed");
    const statPostponed = document.getElementById("stat-postponed");
    const taskChart = document.getElementById("task-chart");
    const chartText = document.getElementById("chart-text");
    const performanceBarChart = document.getElementById("performance-bar-chart");

    // إعداد التواريخ الافتراضية لعام 2026
    const today = new Date().toISOString().split('T')[0];
    taskDate.value = today;
    filterDateInput.value = today;

    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    todayDateDisplay.innerText = "اليوم: " + new Date().toLocaleDateString('ar-EG', optionsDate);

    // ⏳ متغيرات نظام تتبع الوقت الفعلي (Timer System) ⏳
    let activeTaskId = null;
    let timerInterval = null;
    let globalTasks = []; // سيتم ملؤها من السيرفر حقيقياً!

    // دالة لجلب الـ CSRF Token المدمج لحماية طلبات الـ POST في Django
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // ─── 3. دوال الـ Fetch للاتصال مع الـ Django API ───

    // جلب المهام الخاصة بالمستخدم الحالي
    async function fetchTasks() {
        try {
            const response = await fetch('/api/tasks/');

            if (response.ok) {
                // إذا كان المستخدم مسجل، كمل الخدمة عادي
                globalTasks = await response.json();
                updateDashboardUI();
                renderTodayTasks();

                if (sectionEditor && !sectionEditor.classList.contains('hidden')) {
                    renderEditorTasks();
                    renderWeeklyTable();
                }
                if (sectionAllTasks && !sectionAllTasks.classList.contains('hidden')) {
                    renderTimeline();
                }
            } else if (response.status === 403 || response.status === 401) {
                // إذا لم يكن مسجلاً (403 forbidden أو 401 unauthorized)، 
                // كنحولوه لصفحة تسجيل الدخول الخاصة بينا
                window.location.href = '/login/';
            }
        } catch (error) {
            console.error("خطأ أثناء جلب المهام:", error);
        }
    }

    // إضافة مهمة جديدة للسيرفر
    async function addTask(text, date, duration) {
        try {
            const response = await fetch('/api/tasks/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ text, date, duration, status: 'planned', elapsed_seconds: 0 })
            });
            if (response.ok) {
                const newTask = await response.json();
                globalTasks.unshift(newTask);
                fetchTasks();
                successAlert.classList.remove("hidden");
                taskInput.value = "";
                taskInput.focus();
            }
        } catch (error) {
            console.error("خطأ أثناء إضافة المهمة:", error);
        }
    }

    // تحديث حالة المهمة أو العداد الزمني في قاعدة البيانات
    async function updateTaskOnServer(id, updatedFields) {
        try {
            const response = await fetch(`/api/tasks/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(updatedFields)
            });
            if (response.ok) {
                const updatedTask = await response.json();
                globalTasks = globalTasks.map(t => t.id === id ? updatedTask : t);
                updateDashboardUI();
            }
        } catch (error) {
            console.error("خطأ أثناء تحديث المهمة الحالية:", error);
        }
    }

    // حذف مهمة نهائياً من قاعدة البيانات
    async function deleteTaskFromServer(id) {
        try {
            const response = await fetch(`/api/tasks/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            if (response.ok) {
                globalTasks = globalTasks.filter(t => t.id !== id);
                fetchTasks();
            }
        } catch (error) {
            console.error("خطأ أثناء حذف المهمة:", error);
        }
    }

    // ─── 4. نظام التنقل والتبديل ───
    menuHome.addEventListener("click", () => { switchPage(menuHome, sectionHome); renderTodayTasks(); });
    menuEditor.addEventListener("click", () => { switchPage(menuEditor, sectionEditor); renderEditorTasks(); renderWeeklyTable(); });
    menuAllTasks.addEventListener("click", () => { switchPage(menuAllTasks, sectionAllTasks); renderTimeline(); });

    function switchPage(activeButton, activeSection) {
        [menuHome, menuEditor, menuAllTasks].forEach(btn => btn.classList.remove("active"));
        [sectionHome, sectionEditor, sectionAllTasks].forEach(sec => sec.classList.add("hidden"));
        activeButton.classList.add("active");
        activeSection.classList.remove("hidden");
        successAlert.classList.add("hidden");
        fetchTasks();
    }

    dashStartDate.addEventListener("change", updateDashboardUI);
    dashEndDate.addEventListener("change", updateDashboardUI);
    resetFilterBtn.addEventListener("click", () => { dashStartDate.value = ""; dashEndDate.value = ""; updateDashboardUI(); });
    filterDateInput.addEventListener("change", renderEditorTasks);

    // ─── 5. الـ Modals وإغلاقها ───
    function openEditModal(task) {
        editTaskId.value = task.id;
        editTaskInput.value = task.text;
        editTaskDate.value = task.date;
        editModal.classList.remove("hidden");
    }
    function closeModal() { editModal.classList.add("hidden"); }
    function closeErrorModal() { errorModal.classList.add("hidden"); }

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    if (closeErrorBtn) closeErrorBtn.addEventListener("click", closeErrorModal);
    if (okErrorBtn) okErrorBtn.addEventListener("click", closeErrorModal);

    updateTaskBtn.addEventListener("click", async function () {
        const id = parseInt(editTaskId.value);
        const newText = editTaskInput.value.trim();
        const newDate = editTaskDate.value;
        if (newText && newDate) {
            await updateTaskOnServer(id, { text: newText, date: newDate });
            closeModal();
            fetchTasks();
        }
    });

    saveTaskBtn.addEventListener("click", function () {
        const text = taskInput.value.trim();
        const dateValue = taskDate.value;
        const duration = parseInt(taskDuration.value) || 30;
        if (text && dateValue) addTask(text, dateValue, duration);
    });

    // ─── 6. رندرة مهام اليوم وإدارة المؤقت الفعلي والمنع الذكي ───
    function renderTodayTasks() {
        todayTasksList.innerHTML = "";
        const todayTasks = globalTasks.filter(task => task.date === today && task.status === 'planned');

        if (todayTasks.length === 0) {
            todayTasksList.innerHTML = "<p style='color: var(--text-secondary); font-size: 13px;'>لا توجد مهام متبقية لليوم الحالي! ✨</p>";
            return;
        }

        todayTasks.forEach(task => {
            const li = document.createElement("li");
            li.className = "task-item-horizontal";

            const mins = Math.floor(task.elapsed_seconds / 60);
            const secs = task.elapsed_seconds % 60;
            const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            const isCurrentRunning = (activeTaskId === task.id);

            li.innerHTML = `
                <div class="task-meta-side">
                    <h5>${task.text}</h5>
                    <div class="task-subtext">
                        <span>⏱️ المخطط: ${task.duration} دقيقة</span>
                        <span class="timer-display ${isCurrentRunning ? 'running' : ''}">⏳ الفعلي: <strong>${timeFormatted}</strong></span>
                    </div>
                </div>
                <div class="task-control-actions">
                    <button class="btn-ctrl btn-time-toggle ${isCurrentRunning ? 'paused' : 'started'}">
                        ${isCurrentRunning ? '⏸️ مؤقت' : '▶️ ابدأ'}
                    </button>
                    <button class="btn-ctrl btn-ctrl-success">✓ إنجاز</button>
                    <button class="btn-ctrl btn-ctrl-postpone">↩️ تأجيل</button>
                </div>
            `;

            // زر التشغيل والإيقاف المؤقت مع الحماية من التداخل
            li.querySelector(".btn-time-toggle").addEventListener("click", () => {
                if (activeTaskId !== null && activeTaskId !== task.id) {
                    errorModal.classList.remove("hidden"); // عرض نافذة التنبيه في المنتصف فورا
                    return;
                }
                toggleTimer(task);
            });

            // زر الإنجاز المباشر
            li.querySelector(".btn-ctrl-success").addEventListener("click", async () => {
                if (activeTaskId === task.id) stopTimer(task.id);
                await updateTaskOnServer(task.id, { status: 'completed' });
                fetchTasks();
            });

            // زر التأجيل المباشر
            li.querySelector(".btn-ctrl-postpone").addEventListener("click", async () => {
                if (activeTaskId === task.id) stopTimer(task.id);
                await updateTaskOnServer(task.id, { status: 'postponed' });
                fetchTasks();
            });

            todayTasksList.appendChild(li);
        });
    }

    function toggleTimer(task) {
        if (activeTaskId === task.id) {
            stopTimer(task.id);
        } else {
            activeTaskId = task.id;
            timerInterval = setInterval(() => {
                task.elapsed_seconds += 1;
                // رندرة سريعة للأرقام في الشاشة لكي يراها المستخدم تحدث في نفس الثانية
                renderTodayTasks();
            }, 1000);
        }
        renderTodayTasks();
    }

    async function stopTimer(taskId) {
        clearInterval(timerInterval);
        timerInterval = null;
        activeTaskId = null;
        const task = globalTasks.find(t => t.id === taskId);
        if (task) {
            // حفظ الثواني المستغرقة الحقيقية في الـ Database فور الإيقاف المؤقت
            await updateTaskOnServer(taskId, { elapsed_seconds: task.elapsed_seconds });
        }
        renderTodayTasks();
    }

    // ─── 7. رندرة محرر المهام (Editor) ───
    function renderEditorTasks() {
        editorTasksTbody.innerHTML = "";
        const selectedDate = filterDateInput.value;
        const dayTasks = globalTasks.filter(task => task.date === selectedDate);

        if (dayTasks.length === 0) {
            noTasksMsg.classList.remove("hidden");
            return;
        }
        noTasksMsg.classList.add("hidden");

        dayTasks.forEach(task => {
            const tr = document.createElement("tr");
            let sitClass = task.status === 'completed' ? 'completed' : (task.status === 'postponed' ? 'postponed' : 'planned');
            let sitText = task.status === 'completed' ? 'تَمّت بنجاح' : (task.status === 'postponed' ? 'مؤجلة' : 'ما زالت مجدولة');

            tr.innerHTML = `
                <td style="font-weight: 500;">${task.text}</td>
                <td>⏱️ ${task.duration} دقيقة</td>
                <td><span class="situation-badge ${sitClass}">${sitText}</span></td>
                <td>
                    <div class="task-actions">
                        <button class="btn-action btn-edit">✏️ تعديل</button>
                        <button class="btn-action btn-delete">🗑️ حذف</button>
                    </div>
                </td>
            `;
            tr.querySelector(".btn-edit").addEventListener("click", () => openEditModal(task));
            tr.querySelector(".btn-delete").addEventListener("click", async () => {
                if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
                    if (activeTaskId === task.id) { clearInterval(timerInterval); activeTaskId = null; }
                    await deleteTaskFromServer(task.id);
                }
            });
            editorTasksTbody.appendChild(tr);
        });
    }

    // ─── 8. الجدول الأسبوعي ───
    function renderWeeklyTable() {
        weeklyTasksTbody.innerHTML = "";
        const arabicDays = ["الإثنين (Lundi)", "الثلاثاء (Mardi)", "الأربعاء (Mercredi)", "الخميس (Jeudi)", "الجمعة (Vendredi)", "السبت (Samedi)", "الأحد (Dimanche)"];

        const currentNavDate = new Date();
        const currentDayIndex = currentNavDate.getDay();
        const distanceToMonday = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;

        const mondayDate = new Date(currentNavDate);
        mondayDate.setDate(mondayDate.getDate() + distanceToMonday);

        for (let i = 0; i < 7; i++) {
            const loopDate = new Date(mondayDate);
            loopDate.setDate(mondayDate.getDate() + i);
            const loopDateStr = loopDate.toISOString().split('T')[0];

            const tr = document.createElement("tr");
            const dayTasks = globalTasks.filter(task => task.date === loopDateStr);

            let tasksCellContent = "";
            let situationsCellContent = "";

            if (dayTasks.length === 0) {
                tasksCellContent = `<span class="weekly-free-day">✨ Jour Libre</span>`;
                situationsCellContent = `-`;
            } else {
                tasksCellContent = `<ul class="weekly-task-inline-list">`;
                situationsCellContent = `<div class="weekly-situations-container">`;

                dayTasks.forEach(task => {
                    tasksCellContent += `<li class="weekly-task-inline-item">▪ ${task.text} <small style="color:var(--text-secondary);">(${task.duration} د)</small></li>`;
                    let sitClass = task.status === 'completed' ? 'completed' : (task.status === 'postponed' ? 'postponed' : 'planned');
                    let sitText = task.status === 'completed' ? 'منجزة' : (task.status === 'postponed' ? 'مؤجلة' : 'مجدولة');
                    situationsCellContent += `<div style="margin-bottom: 2px;"><span class="situation-badge ${sitClass}">${sitText}</span></div>`;
                });

                tasksCellContent += `</ul>`;
                situationsCellContent += `</div>`;
            }

            if (loopDateStr === today) {
                tr.style.backgroundColor = "rgba(99, 102, 241, 0.08)";
            }

            tr.innerHTML = `
                <td style="font-weight:bold; color:var(--primary);">
                    ${arabicDays[i]}<br>
                    <small style="color:var(--text-secondary); font-weight:normal;">${loopDateStr.substring(5)}</small>
                </td>
                <td>${tasksCellContent}</td>
                <td>${situationsCellContent}</td>
            `;
            weeklyTasksTbody.appendChild(tr);
        }
    }

    // ─── 9. الـ Timeline الكاملة ───
    function renderTimeline() {
        timelineContainer.innerHTML = "";
        const next7Days = [];
        for (let i = 0; i < 7; i++) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + i);
            next7Days.push(nextDate.toISOString().split('T')[0]);
        }

        next7Days.forEach(date => {
            const daySection = document.createElement("div");
            daySection.className = "day-section";
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            const formattedDate = new Date(date).toLocaleDateString('ar-EG', options);

            daySection.innerHTML = `<div class="day-title">📅 ${formattedDate} ${date === today ? '(اليوم)' : ''}</div>`;
            const dayTasks = globalTasks.filter(task => task.date === date);

            if (dayTasks.length === 0) {
                daySection.innerHTML += `<div class="free-day-msg">✨ يوم حر! لا توجد مهام مجدولة.</div>`;
            } else {
                const ul = document.createElement("ul");
                ul.style.listStyle = "none";
                dayTasks.forEach(task => {
                    const li = document.createElement("li");
                    li.className = "task-item";
                    let statusText = task.status === 'completed' ? '✓ منجزة' : (task.status === 'postponed' ? '↪️ مؤجلة' : '⏳ مخطط لها');
                    li.innerHTML = `
                        <div class="task-info"><h5>${task.text}</h5><span>⏱️ ${task.duration} دقيقة</span></div>
                        <span style="font-size:12px; font-weight:bold; color:${task.status === 'completed' ? 'var(--success)' : 'var(--secondary)'}">${statusText}</span>
                    `;
                    ul.appendChild(li);
                });
                daySection.appendChild(ul);
            }
            timelineContainer.appendChild(daySection);
        });
    }

    // ─── 10. تحديث حساب الإحصائيات والرسوم البيانية المدمجة ───
    function updateDashboardUI() {
        const start = dashStartDate.value;
        const end = dashEndDate.value;

        let filteredTasks = globalTasks;
        if (start) filteredTasks = filteredTasks.filter(t => t.date >= start);
        if (end) filteredTasks = filteredTasks.filter(t => t.date <= end);

        const planned = filteredTasks.filter(t => t.status === 'planned').length;
        const completed = filteredTasks.filter(t => t.status === 'completed').length;
        const postponed = filteredTasks.filter(t => t.status === 'postponed').length;

        statPlanned.innerText = planned;
        statCompleted.innerText = completed;
        statPostponed.innerText = postponed;

        const total = planned + completed + postponed;
        const style = getComputedStyle(document.documentElement);
        const colorSuccess = style.getPropertyValue('--success').trim();
        const colorSecondary = style.getPropertyValue('--secondary').trim();
        const colorBorder = style.getPropertyValue('--border').trim();

        if (total === 0) {
            taskChart.style.background = `conic-gradient(${colorBorder} 0% 100%)`;
            chartText.innerText = "0%";
        } else {
            const plannedPct = Math.round((planned / total) * 100);
            const completedPct = Math.round((completed / total) * 100);
            chartText.innerText = `${completedPct}%`;
            taskChart.style.background = `conic-gradient(${colorSecondary} 0% ${plannedPct}%, ${colorSuccess} ${plannedPct}% ${plannedPct + completedPct}%, #f59e0b ${plannedPct + completedPct}% 100%)`;
        }

        performanceBarChart.innerHTML = "";
        const uniqueDates = [...new Set(filteredTasks.map(t => t.date))].sort();

        if (uniqueDates.length === 0) {
            performanceBarChart.innerHTML = "<p style='color:var(--text-secondary); font-size:11px; margin:auto;'>لا توجد مهام.</p>";
            return;
        }

        uniqueDates.forEach(date => {
            const dayTasks = filteredTasks.filter(t => t.date === date);
            const comp = dayTasks.filter(t => t.status === 'completed').length;
            const percentage = dayTasks.length > 0 ? Math.round((comp / dayTasks.length) * 100) : 0;

            const barWrapper = document.createElement("div");
            barWrapper.className = "bar-wrapper";
            const dayName = new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' });

            barWrapper.innerHTML = `
                <div class="bar" style="height: ${percentage}%">
                    <span class="bar-tooltip">${percentage}% إنجاز</span>
                </div>
                <div class="bar-label">${dayName}<br><small style="font-size:9px">${date.substring(5)}</small></div>
            `;
            performanceBarChart.appendChild(barWrapper);
        });
    }

    // 🚀 التشغيل الأولي الفوري عند فتح الموقع
    fetchTasks();
});