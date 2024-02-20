<template>
  <MainLayout>
    <div id="IndexPage" class="h-screen pb-12">
      <NuxtImg
        oncontextmenu="return false;"
        class="absolute object-cover w-full h-screen -z-10"
        format="webp"
        sizes="sm:100px md:300px lg:900px"
        src="../public/mesh-gradient.jpeg"
        alt=""
      />

      <div
        class="wrapper flex flex-col lg:flex-row items-center justify-center h-full my-auto"
      >
        <NuxtImg
          class="lg:order-1 pr-6 lg:mx-0 w-[14em] sm:w-[15em] md:w-[18em] lg:w-[19em] woman-blob shadow-2xl shadow-amber-100"
          format="webp"
          src="../public/model-mobile.jpg"
          alt="Woman model holding lipstick"
        />

        <!-- Desktop -->
        <div
          class="mx-auto lg:mx-12 lg:flex flex-col items-start gap-12 hidden"
        >
          <h2
            class="lg:text-5xl text-2xl md:text-4xl w-1/3 md:w-full nanum-font font-bold"
          >
            Beauty's Essence Explored
          </h2>
          <p class="w-2/3 text-sm lg:text-lg">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque quas
            similique minus impedit? Placeat, mollitia?
          </p>
          <button
            class="text-xl nanum-font py-2 px-5 border border-gray-600 hover:bg-white transition hover:shadow-md"
          >
            Buy Now
            <Icon class="ml-1" name="teenyicons:arrow-right-outline" />
          </button>
        </div>

        <!-- Mobile -->
        <div
          class="flex flex-col items-center gap-8 lg:hidden mt-10 text-center mx-2"
        >
          <h2 class="text-4xl nanum-font font-bold">
            Beauty's Essence Explored
          </h2>
          <p class="mx-16 text-sm lg:text-lg">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque quas
            similique minus impedit? Placeat, mollitia?
          </p>
          <button
            class="text-xl nanum-font py-2 px-5 border border-gray-600 hover:bg-[#ffffffb2] transition hover:shadow-md"
          >
            Buy Now
            <Icon class="ml-1" name="teenyicons:arrow-right-outline" />
          </button>
        </div>
      </div>
      <Products />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from "~/layouts/MainLayout.vue"
import Products from "~/src/components/Products.vue"
</script>
