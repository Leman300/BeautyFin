<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
useHead({
  title: "My App",
  meta: [
    { name: "description", content: "My amazing site." },
    { name: "robots", content: "index, follow" },
    { name: "author", content: "Bartosz Lemanek" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "keywords", content: "keyword1, keyword2, keyword3" },
  ],
})
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap");
@import url("./src/scss/styles.scss");
@import "primeicons/primeicons.css";
</style>
