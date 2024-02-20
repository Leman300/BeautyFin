<template>
  <div class="footer-bg">
    <footer class="text-black py-4 h-full">
      <div
        class="wrapper mx-auto flex flex-col md:flex-row justify-between items-center gap-12 py-8"
      >
        <div class="text-center md:text-left">
          <h3 class="text-lg font-semibold">Contact</h3>
          <p><Icon name="bi:envelope" /> Email: example@example.com</p>
          <p><Icon name="bi:telephone" /> Phone number: 123-456-789</p>
        </div>
        <div class="text-center md:text-left mt-4 md:mt-0">
          <h3 class="text-lg font-semibold">Navigation</h3>
          <ul class="mt-2">
            <li class="hover:bg-white py-1 px-2 transition rounded-xl">
              <a href="/">Home</a>
            </li>
            <li class="hover:bg-white py-1 px-2 transition rounded-xl">
              <a href="/">Shop</a>
            </li>
            <li class="hover:bg-white py-1 px-2 transition rounded-xl">
              <a href="/">About</a>
            </li>
          </ul>
        </div>
        <p class="text-center md:text-right">
          &copy; {{ getCurrentYear() }}
          <span class="font-bold">BeautyFin</span> All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  methods: {
    getCurrentYear() {
      return new Date().getFullYear()
    },
  },
}
</script>

<style scoped>
.footer-bg {
  background-color: #fef0f6;
}
</style>
