const card = document.createElement('div');
card.className = 'image-card';

const img = document.createElement('img');
img.src = `/uploads/${filename}`;  // ✅ Direct image URL
img.alt = filename;

const downloadBtn = document.createElement('button');
downloadBtn.textContent = 'Download';
downloadBtn.onclick = () => {
  const link = document.createElement('a');
  link.href = `/uploads/${filename}`;  // ✅ No longer using /download/
  link.download = filename;
  link.click();
};

card.appendChild(img);
card.appendChild(downloadBtn);
container.appendChild(card);
