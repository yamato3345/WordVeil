let selectionMode = false;

const sendToBridge = async (text) => {
  const value = (text || '').trim();
  if (!value) return;

  try {
    await fetch('http://127.0.0.1:8765', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: value }),
    });
  } catch (error) {
    console.error('WordVeil bridge error:', error);
  }
};

document.addEventListener('keydown', (event) => {
  const isShortcut = event.ctrlKey && event.shiftKey && (event.key === '1' || event.code === 'Digit1');
  if (isShortcut) {
    selectionMode = true;
    event.preventDefault();
  }

  if (event.key === 'Escape') {
    selectionMode = false;
  }
});

document.addEventListener('mouseup', async () => {
  if (!selectionMode) return;

  const selectedText = window.getSelection()?.toString();
  selectionMode = false;

  if (!selectedText || selectedText.trim().length < 2) {
    return;
  }

  await sendToBridge(selectedText);
});
