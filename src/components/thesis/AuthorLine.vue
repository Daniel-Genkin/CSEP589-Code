<script setup>
import { trackRecordLine } from '@/utils/thesis'

defineProps({
  author: { type: Object, required: true },
  size: { type: String, default: 'md' },
  link: { type: Boolean, default: true },
  showRecord: { type: Boolean, default: true },
  caption: { type: String, default: '' },
})
</script>

<template>
  <component
    :is="link ? 'RouterLink' : 'span'"
    :to="link ? `/u/${author.handle}` : undefined"
    class="author"
    :class="[`author--${size}`, { 'author--link': link }]"
  >
    <span class="avatar author__avatar">{{ author.initials }}</span>
    <span class="author__text">
      <span class="author__name">
        {{ author.name }} <span class="author__handle">@{{ author.handle }}</span>
      </span>
      <span v-if="caption" class="author__meta">{{ caption }}</span>
      <span v-else-if="showRecord && author.record" class="author__meta">{{ trackRecordLine(author.record) }}</span>
    </span>
  </component>
</template>

<style scoped>
.author {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.author__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.author__name {
  font-weight: 700;
  font-size: 14.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.author__handle {
  font-weight: 600;
  color: var(--muted);
}
.author__meta {
  font-size: 13px;
  color: var(--muted);
}
.author--link:hover .author__name {
  color: var(--brand-700);
}
.author--sm .author__avatar {
  width: 30px;
  height: 30px;
  font-size: 12px;
}
.author--sm .author__name {
  font-size: 13.5px;
}
.author--sm .author__meta {
  font-size: 12.5px;
}
.author--lg .author__avatar {
  width: 48px;
  height: 48px;
  font-size: 17px;
}
.author--lg .author__name {
  font-size: 16px;
}
</style>
