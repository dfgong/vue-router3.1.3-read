import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  // gongdf-避免多次use的问题
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    // gongdf- _parentVnode是什么？
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  Vue.mixin({
    beforeCreate () {
      // gongdf-实现router的注入
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        // gongdf-定义响应式，将_route下的数据用defineProperty定义get、set，并订阅。
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // gongdf-_routerRoot是当前vue的实例
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

  // gongdf-虽然挂在Vue.prototype上，但每次get的都是当前vue实例的_router，优雅的避免每次切换组件后的赋值处理
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
