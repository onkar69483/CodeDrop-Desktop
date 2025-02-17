document.addEventListener('DOMContentLoaded', async () => {
    const clipboardList = document.getElementById('clipboard-list');

    // Fetch clipboard history from the backend
    const clipboardHistory = await window.electron.getClipboardHistory();

    // Display clipboard items in the UI
    clipboardHistory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.text;
        clipboardList.appendChild(li);
    });
});
