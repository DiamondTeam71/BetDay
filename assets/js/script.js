document.addEventListener('DOMContentLoaded', function () {
    const locationBtn = document.getElementById("location-btn");
    locationBtn.addEventListener("click", () => {
        window.open("https://maps.app.goo.gl/ccqRvcB8uH9peCRq6", "_blank");
    
document.addEventListener('DOMContentLoaded', function () {
  const profileBtnEl = document.getElementById('profile-btn');
  const popupMenuEl = document.getElementById('profile-popup');
  const enBtn = document.getElementById('en-btn');
  const bnBtn = document.getElementById('bn-btn');
  const modal = document.getElementById("custom-modal");
  const closeBtn = document.querySelector(".close-btn");
  const modalTitle = document.getElementById("modal-title");
  const modalImg = document.getElementById("modal-img");
  const modalText = document.getElementById("modal-text");
  const contactBtnEl = document.querySelector('.contact-btn');
  const contactMenuEl = document.querySelector('.contact-menu');
  const contactOptionsEl = document.querySelector('.contact-options');
  const track = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  let currentIndex = 0;
  let startX = 0;
  let isDragging = false;

  profileBtnEl.addEventListener('click', e => {
      e.preventDefault();
      popupMenuEl.style.display = popupMenuEl.style.display === 'flex' ? 'none' : 'flex';
  });

  document.addEventListener('click', e => {
      if (!profileBtnEl.contains(e.target) && !popupMenuEl.contains(e.target)) {
          popupMenuEl.style.display = 'none';
      }
  });

  function setActiveBtn(activeBtn) {
      bnBtn.classList.remove('active');
      enBtn.classList.remove('active');
      activeBtn.classList.add('active');
  }

  bnBtn.addEventListener('click', e => {
      e.preventDefault();
      setActiveBtn(bnBtn);
      popupMenuEl.style.display = 'none';
      window.location.href = '#';
  });

  enBtn.addEventListener('click', e => {
      e.preventDefault();
      setActiveBtn(enBtn);
      popupMenuEl.style.display = 'none';
      window.location.href = 'https://translate.google.com/translate?sl=auto&tl=en&u=' + encodeURIComponent(window.location.href);
  });

  function generateContactLinks(type, link1, mail, whatsapp, youtube, facebook) {
      let icon1 = type === "developer"
          ? `<a href="${link1}" target="_blank" style="color:#2980b9; font-size:20px;"><i class="fas fa-globe"></i></a>`
          : `<a href="${link1}" target="_blank" style="color:#E1306C; font-size:20px;"><i class="fab fa-instagram"></i></a>`;
      return `<div style="display:flex; justify-content:center; gap:12px; margin-top:15px;">
          ${icon1}
          <a href="mailto:${mail}" style="color:#27ae60; font-size:20px;"><i class="fas fa-envelope"></i></a>
          <a href="https://wa.me/${whatsapp}" target="_blank" style="color:#25D366; font-size:20px;"><i class="fab fa-whatsapp"></i></a>
          <a href="${youtube}" target="_blank" style="color:#FF0000; font-size:20px;"><i class="fab fa-youtube"></i></a>
          <a href="${facebook}" target="_blank" style="color:#1877F2; font-size:20px;"><i class="fab fa-facebook-f"></i></a>
      </div>`;
  }

  modalText.innerHTML = `<div id="info-text"></div><div id="contact-links"></div>`;

  document.getElementById("developer-btn").addEventListener("click", e => {
      e.preventDefault();
      popupMenuEl.style.display = 'none';
      modal.style.display = "flex";
      modalTitle.innerText = "সাইট নির্মাতা এর তথ্য!";
      modalImg.src = "assets/images/developer.jpg";
      const infoDiv = document.getElementById("info-text");
      const linksDiv = document.getElementById("contact-links");
      infoDiv.innerHTML = `<p><i class="fas fa-user" style="color:#e74c3c;"></i> <strong>নির্মাতার নাম:</strong> Xrabon</p>
          <p><i class="fas fa-briefcase" style="color:#3498db;"></i> <strong>অভিজ্ঞতা:</strong> Web Development এ প্রায় <strong>২ বছরের বেশি</strong> কার্যকরী অভিজ্ঞতা।</p>
          <p><i class="fas fa-user" style="color: black;"></i> <strong>বয়স:</strong> ১৫ বছর!</p>
          <p><i class="fas fa-project-diagram" style="color:#f39c12;"></i> <strong>প্রকল্পসমূহ:</strong> E-COMMERCE Business Website, Investing Sites, Small Games, Portfolios, Offices Projects ইত্যাদি।</p>
          <p><i class="fas fa-lightbulb" style="color:#8e44ad;"></i> <strong>বিশেষত্ব:</strong> UI/UX ডিজাইন, Frontend & Backend দক্ষতা।</p>`;
      linksDiv.innerHTML = generateContactLinks(
          "developer",
          "https://www.Xrabon.com/",
          "developer@example.com",
          "8801300226699",
          "https://youtube.com/channel/xyz",
          "https://facebook.com/username"
      );
  });

  document.getElementById("seller-btn").addEventListener("click", e => {
    e.preventDefault();
    popupMenuEl.style.display = 'none';
    window.location.href = 'NittoSodaiAbout.html';
});

  closeBtn.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

  contactBtnEl.addEventListener('click', e => { e.stopPropagation(); contactMenuEl.classList.toggle('active'); });
  document.addEventListener('click', e => { if (!contactMenuEl.contains(e.target)) contactMenuEl.classList.remove('active'); });

  function updateSlide() {
      track.style.transition = 'transform 0.5s ease';
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach(dot => dot.classList.remove('active'));
      dots[currentIndex].classList.add('active');
  }
  updateSlide();
  let slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
  }, 3000);
  dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
          currentIndex = idx;
          updateSlide();
          clearInterval(slideInterval);
          slideInterval = setInterval(() => { currentIndex = (currentIndex + 1) % slides.length; updateSlide(); }, 3000);
      });
  });
  track.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      isDragging = true;
      track.style.transition = 'none';
  });
  track.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const moveX = e.touches[0].clientX - startX;
      track.style.transform = `translateX(${-currentIndex * 100 + moveX / slides[0].clientWidth * 100}%)`;
  });
  track.addEventListener('touchend', e => {
      if (!isDragging) return;
      isDragging = false;
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 50) currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      else if (diff < -50) currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
      clearInterval(slideInterval);
      slideInterval = setInterval(() => { currentIndex = (currentIndex + 1) % slides.length; updateSlide(); }, 3000);
  });

  function updateCartCount() {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const countSpan = document.getElementById('cart-count');
      const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.qty) || 1), 0);
      countSpan.style.display = totalQty > 0 ? 'inline-block' : 'none';
      countSpan.textContent = totalQty;
  }
  function addToCart(item) {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart.push(item);
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
  }
  function removeFromCart(index) {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
  }
  updateCartCount();
});


