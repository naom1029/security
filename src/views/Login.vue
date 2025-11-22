<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')

const handleLogin = () => {
  // ここにログイン処理を実装します
  console.log('Login attempt:', email.value, password.value)
  // ログイン成功後のリダイレクトなどを想定
  // router.push('/')
}
</script>

<template>
  <div class="login-container">
    <h1>ログイン</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input 
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="example@email.com"
        >
      </div>
      
      <div class="form-group">
        <label for="password">パスワード</label>
        <input 
          id="password"
          v-model="password"
          type="password"
          required
        >
      </div>

      <button type="submit">ログイン</button>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}
</style>
