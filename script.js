document.addEventListener("DOMContentLoaded", function () {

    // ─── 1. عناصر المظهر والـ Dark Mode ───
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

    // عناصر نافذة الخطأ الجديدة
    const errorModal = document.getElementById("error-modal");
    const closeErrorBtn = document.getElementById("close-error-btn");
    const okErrorBtn = document.getElementById("ok-error-btn");

    if (editModal) editModal.classList.add("hidden");
    if (errorModal) errorModal.classList.add("hidden");

    // عناصر الإحصائيات
    const statPlanned = document.getElementById("stat-planned");
    const statCompleted = document.getElementById("stat-completed");
    const statPostponed = document.getElementById("stat-postponed");
    const taskChart = document.getElementById("task-chart");
    const chartText = document.getElementById("chart-text");
    const performanceBarChart = document.getElementById("performance-bar-chart");

    // إعداد التواريخ الافتراضية
    const today = new Date().toISOString().split('T')[0];
    taskDate.value = today;
    filterDateInput.value = today;
    dashStartDate.value = "2026-06-12";
    dashEndDate.value = "2026-06-20";

    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    todayDateDisplay.innerText = "اليوم: " + new Date().toLocaleDateString('ar-EG', optionsDate);

    // ⏳ إعدادات نظام تتبع الوقت الفعلي (Timer System) ⏳
    let activeTaskId = null; // يحفظ معرّف المهمة الشغالة حالياً
    let timerInterval = null; // يحفظ الـ Interval المسؤول عن العداد

    // مصفوفة البيانات الأساسية (أضفنا حقل الـ elapsedSeconds لتتبع ثواني العمل الفعلي)
    let globalTasks = [
        { id: 1, text: "برمجة لوحة التحكم الجديدة", date: today, duration: 60, status: 'completed', elapsedSeconds: 0 },
        { id: 2, text: "مراجعة كود الجافاسكربت", date: today, duration: 40, status: 'planned', elapsedSeconds: 0 },
        { id: 3, text: "مهمة تجريبية داخل النطاق 1", date: "2026-06-15", duration: 30, status: 'completed', elapsedSeconds: 0 },
        { id: 4, text: "مهمة تجريبية داخل النطاق 2", date: "2026-06-17", duration: 45, status: 'planned', elapsedSeconds: 0 },
        { id: 5, text: "مهمة مؤجلة في النطاق", date: "2026-06-18", duration: 60, status: 'postponed', elapsedSeconds: 0 }
    ];

    // ─── 3. نظام التنقل ───
    menuHome.addEventListener("click", () => {
        switchPage(menuHome, sectionHome);
        renderTodayTasks();
        updateDashboardUI();
    });
    menuEditor.addEventListener("click", () => {
        switchPage(menuEditor, sectionEditor);
        renderEditorTasks();
        renderWeeklyTable();
    });
    menuAllTasks.addEventListener("click", () => {
        switchPage(menuAllTasks, sectionAllTasks);
        renderTimeline();
    });

    function switchPage(activeButton, activeSection) {
        [menuHome, menuEditor, menuAllTasks].forEach(btn => btn.classList.remove("active"));
        [sectionHome, sectionEditor, sectionAllTasks].forEach(sec => sec.classList.add("hidden"));
        activeButton.classList.add("active");
        activeSection.classList.remove("hidden");
        successAlert.classList.add("hidden");
    }

    dashStartDate.addEventListener("change", updateDashboardUI);
    dashEndDate.addEventListener("change", updateDashboardUI);
    resetFilterBtn.addEventListener("click", () => {
        dashStartDate.value = "";
        dashEndDate.value = "";
        updateDashboardUI();
    });

    filterDateInput.addEventListener("change", renderEditorTasks);

    // ─── 4. إدارة نوافذ الـ Modals (التعديل والخطأ) ───
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

    window.addEventListener("click", function (event) {
        if (event.target === editModal) closeModal();
        if (event.target === errorModal) closeErrorModal();
    });

    updateTaskBtn.addEventListener("click", function () {
        const id = parseInt(editTaskId.value);
        const newText = editTaskInput.value.trim();
        const newDate = editTaskDate.value;

        if (newText === "" || newDate === "") {
            alert("لا يمكن ترك الحقول فارغة!");
            return;
        }

        globalTasks = globalTasks.map(task => task.id === id ? { ...task, text: newText, date: newDate } : task);
        closeModal();
        updateDashboardUI();
        renderEditorTasks();
        renderWeeklyTable();
    });

    // ─── 5. إضافة وحفظ مهمة جديدة ───
    saveTaskBtn.addEventListener("click", function () {
        const text = taskInput.value.trim();
        const dateValue = taskDate.value;
        const duration = parseInt(taskDuration.value) || 30;

        if (text === "" || dateValue === "") {
            alert("من فضلك أدخل البيانات المطلوبة!");
            return;
        }

        globalTasks.push({ id: Date.now(), text: text, date: dateValue, duration: duration, status: 'planned', elapsedSeconds: 0 });
        updateDashboardUI();
        if (dateValue === filterDateInput.value) renderEditorTasks();
        renderWeeklyTable();

        successAlert.classList.remove("hidden");
        taskInput.value = "";
        taskInput.focus();
    });

    // ─── 6. استعراض مهام اليوم والتحكم بالمؤقت الفعلي (الرئيسية) ───
    function renderTodayTasks() {
        todayTasksList.innerHTML = "";
        const todayTasks = globalTasks.filter(task => task.date === today && task.status === 'planned');

        if (todayTasks.length === 0) {
            todayTasksList.innerHTML = "<p style='color: var(--text-secondary); font-size: 14px;'>لا توجد مهام متبقية لليوم الحالي! ✨</p>";
            return;
        }

        todayTasks.forEach(task => {
            const li = document.createElement("li");
            li.className = "task-item-horizontal"; // ستايل السطر الأفقي الجديد

            // تحويل الثواني الملعوبة لصيغة مقروءة دقيقة:ثانية
            const mins = Math.floor(task.elapsedSeconds / 60);
            const secs = task.elapsedSeconds % 60;
            const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            const isCurrentRunning = (activeTaskId === task.id);

            li.innerHTML = `
                <div class="task-meta-side">
                    <h5>${task.text}</h5>
                    <div class="task-subtext">
                        <span>⏱️ المخطط: ${task.duration} دقيقة</span> | 
                        <span class="timer-display ${isCurrentRunning ? 'running' : ''}">⏳ الفعلي الحالي: <strong>${timeFormatted}</strong></span>
                    </div>
                </div>
                <div class="task-control-actions">
                    <button class="btn-ctrl btn-time-toggle ${isCurrentRunning ? 'paused' : 'started'}">
                        ${isCurrentRunning ? '⏸️ إيقاف مؤقت' : '▶️ ابدأ الآن'}
                    </button>
                    <button class="btn-ctrl btn-ctrl-success">✓ إنجاز</button>
                    <button class="btn-ctrl btn-ctrl-postpone">↩️ تأجيل</button>
                </div>
            `;

            // 1. منطق الزر الأول: ابدأ / إيقاف مؤقت مع الحماية من التداخل
            li.querySelector(".btn-time-toggle").addEventListener("click", () => {
                if (activeTaskId !== null && activeTaskId !== task.id) {
                    // إذا كاين شي مهمة أخرى خدامة، كنطلعو الـ Error Modal في السنتر فوراً
                    errorModal.classList.remove("hidden");
                    return;
                }
                toggleTimer(task.id);
            });

            // 2. منطق زر إنجاز
            li.querySelector(".btn-ctrl-success").addEventListener("click", () => {
                if (activeTaskId === task.id) stopTimer();
                changeStatus(task.id, 'completed');
                renderTodayTasks();
            });

            // 3. منطق زر تأجيل
            li.querySelector(".btn-ctrl-postpone").addEventListener("click", () => {
                if (activeTaskId === task.id) stopTimer();
                changeStatus(task.id, 'postponed');
                renderTodayTasks();
            });

            todayTasksList.appendChild(li);
        });
    }

    // إدارة تشغيل وإيقاف العداد
    function toggleTimer(taskId) {
        if (activeTaskId === taskId) {
            // إيقاف مؤقت (Pause)
            stopTimer();
        } else {
            // تشغيل (Start)
            activeTaskId = taskId;
            timerInterval = setInterval(() => {
                globalTasks = globalTasks.map(t => {
                    if (t.id === taskId) {
                        return { ...t, elapsedSeconds: t.elapsedSeconds + 1 };
                    }
                    return t;
                });
                renderTodayTasks(); // تحديث فوري للأرقام في الشاشة كل ثانية
            }, 1000);
        }
        renderTodayTasks();
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        activeTaskId = null;
    }

    // ─── 7. محرر المهام اليومي (Editor) ───
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
            let situationClass = task.status === 'completed' ? 'completed' : (task.status === 'postponed' ? 'postponed' : 'planned');
            let situationText = task.status === 'completed' ? 'تَمّت بنجاح' : (task.status === 'postponed' ? 'مؤجلة' : 'ما زالت مجدولة');

            tr.innerHTML = `
                <td style="font-weight: 500;">${task.text}</td>
                <td>⏱️ ${task.duration} دقيقة</td>
                <td><span class="situation-badge ${situationClass}">${situationText}</span></td>
                <td>
                    <div class="task-actions">
                        <button class="btn-action btn-edit">✏️ تعديل</button>
                        <button class="btn-action btn-delete">🗑️ حذف</button>
                    </div>
                </td>
            `;
            tr.querySelector(".btn-edit").addEventListener("click", () => openEditModal(task));
            tr.querySelector(".btn-delete").addEventListener("click", () => {
                if (confirm("هل أنت متأكد من الحذف؟")) {
                    if (activeTaskId === task.id) stopTimer();
                    globalTasks = globalTasks.filter(t => t.id !== task.id);
                    renderEditorTasks();
                    updateDashboardUI();
                    renderWeeklyTable();
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

    // ─── 9. صفحة كل المهام (Timeline) ───
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

    function changeStatus(id, newStatus) {
        globalTasks = globalTasks.map(task => task.id === id ? { ...task, status: newStatus } : task);
        updateDashboardUI();
        renderWeeklyTable();
    }

    // ─── 10. حساب التحليلات والرسوم البيانية ───
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
            performanceBarChart.innerHTML = "<p style='color:var(--text-secondary); font-size:12px; margin:auto;'>لا توجد مهام في هذه الفترة.</p>";
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

    // التشغيل الأولي
    updateDashboardUI();
    renderTodayTasks();
});