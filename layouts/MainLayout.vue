<template>
  <div id="MainLayout" class="w-full z-50">
    <div class="card">
      <Menubar class="wrapper bg-transparent border-none" :model="items">
        <template #item="{ item, props, root }">
          <a
            v-ripple
            class="flex items-center hover:bg-pink-50 transition rounded-xl"
            v-bind="props.action"
          >
            <span :class="item.icon" />
            <span class="ml-2 text-black">{{ item.label }}</span>
            <Badge
              v-if="item.badge"
              :class="{ 'ml-auto': !root, 'ml-2': root }"
              :value="item.badge"
            />
            <span
              v-if="item.shortcut"
              class="ml-auto border border-surface-200 dark:border-surface-500 rounded-md bg-surface-100 dark:bg-surface-800 text-xs p-1"
              >{{ item.shortcut }}</span
            >
          </a>
        </template>
        <template #end>
          <div class="flex items-center gap-2 mr-4">
            <button>
              <Icon
                name="uiw:user"
                class="hover:bg-pink-50 transition rounded-[50%] p-2"
                size="2.2em"
              />
            </button>

            <button>
              <Icon
                name="ion:bag-outline"
                class="hover:bg-pink-50 transition rounded-[50%] p-2"
                size="2.2em"
              />
            </button>
            <h1
              class="absolute sm:flex hidden items-center left-[50%] -translate-x-1/2 text-4xl nanum-font"
            >
              Logo
            </h1>
          </div>
        </template>
      </Menubar>
    </div>

    <slot />
    <Footer />

  </div>
</template>

<script setup lang="ts">
import Footer from "~/src/components/Footer.vue"
import { ref } from "vue"

const items = ref([
  {
    label: "Home",
  },
  {
    label: "Shop",
  },
  {
    label: "About",
  },
])
</script>
