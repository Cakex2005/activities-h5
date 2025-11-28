import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant' // 引入Vant
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vant) // 全局注册Vant组件
app.mount('#app')
