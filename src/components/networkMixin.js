import { mapState } from 'vuex'
export default {
    computed: {
        ...mapState(['isNetworkError'])
    },
    watch: {
        isNetworkError: {
            handler(v) {
                if (v) {
                    this.$alert('Please connect to Polygon (Matic) or Rinkeby network.', 'Wrong Network', {
                        confirmButtonText: 'Confirm'
                    })
                }
            },
            immediate: true
        }
    }
}
