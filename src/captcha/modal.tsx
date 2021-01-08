import { defineComponent } from 'vue'
import { Tooltip } from 'makeit-tooltip'
import PropTypes from '../utils/props'
import tools from '../utils/tools'

const prefixCls = 'mi-captcha-modal'
const selectors = {
    modal: prefixCls,
    image: `${prefixCls}-image`,
    block: `${prefixCls}-block`,
    slider: `${prefixCls}-slider`,
    mask: `${prefixCls}-mask`,
    result: `${prefixCls}-result`,
    content: `${prefixCls}-content`
}

const urlReg = /^((https|http|ftp|rtsp|mms)?:\/\/)(([0-9A-Za-z_!~*'().&=+$%-]+: )?[0-9A-Za-z_!~*'().&=+$%-]+@)?(([0-9]{1,3}.){3}[0-9]{1,3}|([0-9A-Za-z_!~*'()-]+.)*([0-9A-Za-z][0-9A-Za-z-]{0,61})?[0-9A-Za-z].[A-Za-z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9A-Za-z_!~*'().;?:@&=+$,%#-]+)+\/?)$/

export default defineComponent({
    name: 'MiCaptchaModal',
    props: {
        show: PropTypes.bool.def(false),
        image: PropTypes.string,
        position: PropTypes.object,
        mask: PropTypes.bool.def(true),
        maskClosable: PropTypes.bool.def(true),
        themeColor: PropTypes.string,
        bgColor: PropTypes.string,
        boxShadow: PropTypes.bool.def(true),
        boxShadowColor: PropTypes.string,
        boxShadowBlur: PropTypes.number,
        maxTries: PropTypes.number.def(5),
        onModalClose: PropTypes.func
    },
    data() {
        return {
            prefixCls: 'mi-captcha-modal',
            loading: true,
            background: 'https://file.makeit.vip/MIIT/M00/00/00/ajRkHV7d0JOAJYSMAAFwUxGzMIc287.jpg',
            target: 'https://admin.makeit.vip/components/captcha',
            avatar: 'https://file.makeit.vip/MIIT/M00/00/00/ajRkHV_pUyOALE2LAAAtlj6Tt_s370.png',
            powered: 'Powered By makeit.vip',
            ctx: {
                image: null,
                block: null,
            },
            elements: {
                slider: null,
                block: null
            },
            coordinate: {
                x: 0,
                y: 0,
                offset: 6
            },
            size: {
                width: 260,
                height: 160
            },
            block: {
                size: 42,
                radius: 8,
                PI: Math.PI,
                real: 0
            },
            drag: {
                moving: false,
                originX: 0,
                originY: 0,
                offset: 0
            },
            check: {},
            _background: null
        }
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {
            this._background = this.image ?? this.background
            this.initModal()
        },
        initModal() {
            const slider = this.$refs[`${selectors.slider}-btn`]
            const block = this.$refs[selectors.block]
            this.elements = {slider, block}
            this.block.real = this.block.size + this.block.radius * 2 + 2
            this.setCheckData()
            this.initCaptcha()
        },
        initCaptcha() {
            const image = this.$refs[selectors.image]
            const block = this.$refs[selectors.block]
            const imageCtx = image ? image.getContext('2d') : null
            const blockCtx = block ? block.getContext('2d') : null
            this.ctx = {image: imageCtx, block: blockCtx}
            /**
             * 图片统一转为 base64, 避免跨域问题.
             * 也可采用xhr异步请求图片地址.
             * ```
             * if (this.$g.regExp.url.test(this.background)) {
             *     const xhr = new XMLHttpRequest();
             *     xhr.onload = function() {
             *         if (this.status === 200) {
             *             // 注意 this 指向.
             *             const url = URL.createObjectURL(this.response);
             *             vm.background = url;
             *             vm.initImageElem();
             *             // ...
             *             URL.revokeObjectURL(url);
             *         }
             *     }
             *     xhr.open('GET', this.background, true);
             *     xhr.responseType = 'blob';
             *     xhr.send();
             * } else {
             *     this.initImageElem();
             * }
             * ```
             */
            if (urlReg.test(this._background)) this.imageToBase64(this.initImageElem)
            else this.initImageElem()
        },
        initImage(elem: HTMLElement) {
            if (
                this.ctx.image &&
                this.ctx.block
            ) {
                /** image */
                this.ctx.image.drawImage(
					elem,
					0,
					0,
					this.size.width,
					this.size.height
                )
                /** text */
                this.ctx.image.beginPath()
                this.ctx.image.fillStyle = '#FFF'
				this.ctx.image.shadowColor = 'transparent'
				this.ctx.image.shadowBlur = 0
				this.ctx.image.font = 'bold 24px MicrosoftYaHei'
				this.ctx.image.fillText('拖动滑块拼合图片', 12, 30)
				this.ctx.image.font = '16px MicrosoftYaHei'
				this.ctx.image.fillText('就能验证成功哦', 12, 55)
                this.ctx.image.closePath()
                /** block */
                this.ctx.block.save()
                this.ctx.block.globalCompositeOperation = 'destination-over'
                this.drawBlockPosition()
				this.ctx.block.drawImage(
                    elem,
                    0,
                    0,
                    this.size.width,
                    this.size.height
                )
                /** image data */
                const coordinateY = this.coordinate.y - this.block.radius * 2 + 1
                const imageData = this.ctx.block.getImageData(
                    this.coordinate.x,
                    coordinateY,
                    this.block.real,
                    this.block.real
                )
                const block = this.$refs[selectors.block]
                block.width = this.block.real
                this.ctx.block.putImageData(
                    imageData,
                    this.coordinate.offset,
                    coordinateY
                )
                this.ctx.block.restore()
                this.loading = false
            }
        },
        initImageElem() {
            const elem = new Image()
            elem.src = this._background
            elem.onload = () => this.initImage(elem)
        },
        imageToBase64(callback: Function) {
            const elem = new Image()
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = this.size.width
            canvas.height = this.size.height
            elem.crossOrigin = ''
            elem.src = this._background
            elem.onload = () => {
                ctx.drawImage(
                    elem,
                    0,
                    0,
                    this.size.width,
                    this.size.height
                )
                this._background = canvas.toDataURL()
                if (callback) callback.apply(this)
            }
        },
        drawBlock(
            ctx: CanvasRenderingContext2D,
            direction: any = {},
            operation: string
        ) {
            ctx.beginPath()
            ctx.moveTo(this.coordinate.x, this.coordinate.y)
            const direct = direction.direction
            const type = direction.type
            /** top */
            if (direct === 'top') {
                ctx.arc(
                    this.coordinate.x + this.block.size / 2,
                    this.coordinate.y,
                    this.block.radius,
                    -this.block.PI,
                    0,
                    type === 'inner'
                )
            }
            ctx.lineTo(this.coordinate.x + this.block.size, this.coordinate.y)
            /** right */
            if (direct === 'right') {
                ctx.arc(
                    this.coordinate.x + this.block.size,
                    this.coordinate.y + this.block.size / 2,
                    this.block.radius,
                    1.5 * this.block.PI,
                    0.5 * this.block.PI,
                    type === 'inner'
                )
            }
            ctx.lineTo(this.coordinate.x + this.block.size, this.coordinate.y + this.block.size)
            /** bottom */
            ctx.arc(
                this.coordinate.x + this.block.size / 2,
                this.coordinate.y + this.block.size,
                this.block.radius,
                0,
                this.block.PI,
                true
            )
            ctx.lineTo(this.coordinate.x, this.coordinate.y + this.block.size)
            /** left */
            ctx.arc(
                this.coordinate.x,
                this.coordinate.y + this.block.size / 2,
                this.block.radius,
                0.5 * this.block.PI,
                1.5 * this.block.PI,
                true
            )
            ctx.lineTo(this.coordinate.x, this.coordinate.y)
            ctx.shadowColor = 'rgba(0, 0, 0, .001)'
            ctx.shadowBlur = 20
            ctx.lineWidth = 1.5
            ctx.fillStyle = 'rgba(0, 0, 0, .4)'
            ctx.strokeStyle = 'rgba(255, 255, 255, .8)'
            ctx.stroke()
            ctx.closePath()
            ctx[operation]()
        },
        drawBlockPosition() {
            const x = tools.randomNumberInRange(
                this.block.real + 20,
                this.size.width - (this.block.real + 20)
            )
            const y = tools.randomNumberInRange(55, this.size.height - 55)
            const direction = this.drawBlockDirection()
            this.coordinate.x = x
            this.coordinate.y = y
            this.drawBlock(this.ctx.image, direction, 'fill')
            this.drawBlock(this.ctx.block, direction, 'clip')
        },
        drawBlockDirection() {
            const direction = {top: 'top', right: 'right'}
            const from = ['inner', 'outer']
            const result: any = {}
            const keys = Object.keys(direction)
            const key = keys[Math.floor(Math.random() * keys.length)]
            result.direction = direction[key]
            result.type = from[Math.floor(Math.random() * from.length)]
            return result
        },
        setCheckData() {
            this.check = {
                tries: this.tries ?? 5,
                num: 0,
                being: false,
                value: null,
                correct: false,
                tip: '拖动滑块将悬浮图像正确拼合',
                show: false
            }
        },
        closeModal() {
            if (this.maskClosable) this.$emit('modalClose', 'close')
        },
        getArrowElem() {
            const arrowCls = `${this.prefixCls}-arrow`
            const inStyle = {
                borderColor: this.bgColor
                    ? `transparent ${this.bgColor} transparent transparent`
                    : null
            }
            const outStyle = {
                borderColor: this.themeColor
                    ? `transparent ${this.themeColor} transparent transparent`
                    : null
            }
            return (
                <div class={arrowCls}>
                    <div class={`${arrowCls}-out`} style={outStyle}></div>
                    <div class={`${arrowCls}-in`} style={inStyle}></div>
                </div>
            )
        },
        getMaskElem() {
            return this.mask && this.show ? (
                <div class={`${selectors.mask}`}
                    onClick={this.closeModal}
                    ref={`${selectors.mask}`}>
                </div>
            ) : null
        },
        getContentLoadingElem() {
            const loadingCls = `${this.prefixCls}-loading`
            const style1 = {borderColor: this.themeColor ?? null}
            const style2 = {background: this.themeColor ?? null}
            return this.loading ? (
                <div class={loadingCls}>
                    <div class={`${loadingCls}-spinner`}>
                        <div class="load">
                            <div>
                                <div>
                                    <div style={style1}></div>
                                    <div style={style2}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class={`${loadingCls}-tip`}>正在加载验证码</div>
                </div>
            ) : null
        },
        getContentInfoElem() {
            return (
                <div class={`${this.prefixCls}-info`}>
                    <canvas
                        width={this.size.width}
                        height={this.size.height}
                        ref={`${selectors.image}`}>
                    </canvas>
                    <canvas
                        width={this.size.width}
                        height={this.size.height}
                        ref={`${selectors.block}`}>
                    </canvas>
                </div>
            )
        },
        getContentResultElem() {
            const cls = `${selectors.result} ${this.check.correct ? `${selectors.result}-success` : `${selectors.result}-error`}`
            return <div class={cls} ref={selectors.result} innerHTML={this.check.tip}></div>
        },
        getSliderTrackElem() {
            const sliderTrackCls = `${selectors.slider}-track`
            const style = {borderColor: this.themeColor ?? null}
            return (
                <div class={sliderTrackCls} style={style}>
                    <span class={`${sliderTrackCls}-tip`}>拖动左边滑块完成上方拼图</span>
                </div>
            )
        },
        getSliderBtnElem() {
            const sliderBtnCls = `${selectors.slider}-btn`
            const style = {borderColor: this.themeColor ?? null}
            return (
                <div class={sliderBtnCls} style={style} ref={sliderBtnCls}>
                    <div class={`${sliderBtnCls}-icon`}>
                        <div class={`${sliderBtnCls}-vertical`}></div>
                        <div class={`${sliderBtnCls}-horizontal`}></div>
                    </div>
                </div>
            )
        },
        getPanelActionElem() {
            const panelActionCls = `${this.prefixCls}-panel-action`
            return (
                <div class={panelActionCls}>
                    <Tooltip title="关闭验证" autoAdjust={false} bgColor={this.themeColor}>
                        <i class="mi-icon icon-close" onClick={this.closeModal}></i>
                    </Tooltip>
                    <Tooltip title="刷新验证" autoAdjust={false} bgColor={this.themeColor}>
                        <i class="mi-icon icon-refresh"></i>
                    </Tooltip>
                    <Tooltip title="帮助反馈" autoAdjust={false} bgColor={this.themeColor}>
                        <a href={this.target} target="_blank">
                            <i class="mi-icon icon-question"></i>
                        </a>
                    </Tooltip>
                </div>
            )
        },
        getPanelCopyrightElem() {
            const copyrightCls = `${this.prefixCls}-copyright`
            return (
                <div class={copyrightCls}>
                    <div class={`${copyrightCls}-text`}>
                        <a href={this.target} target="_blank">
                            <img src={this.avatar} alt={this.powered} />
                        </a>
                        <span>提供技术支持</span>
                    </div>
                </div>
            )
        },
        getContentElem() {
            const style = {
                borderColor: this.themeColor ?? null,
                background: this.bgColor ?? null,
                boxShadow: this.boxShadow ? `0 0 ${tools.pxToRem(this.boxShadowBlur)}rem ${this.boxShadowColor}` : null,
            }
            return (
                <div class={selectors.content} style={style} ref={selectors.content}>
                    <div class={`${this.prefixCls}-wrap`}>
                        <div class={`${this.prefixCls}-embed`}>
                            { this.getContentLoadingElem() }
                            { this.getContentInfoElem() }
                            { this.getContentResultElem() }
                        </div>
                        <div class={`${selectors.slider}${this.drag.moving ? ` ${selectors.slider}-moving` : ''}`} ref={selectors.slider}>
                            { this.getSliderTrackElem() }
                            { this.getSliderBtnElem() }
                        </div>
                    </div>
                    <div class={`${this.prefixCls}-panel`}>
                        { this.getPanelActionElem() }
                        { this.getPanelCopyrightElem() }
                    </div>
                </div>
            )
        }
    },
    render() {
        const style = {
            top: `${tools.pxToRem(this.position.top)}rem`,
            left: `${tools.pxToRem(this.position.left)}rem`
        }
        const cls = `${this.prefixCls}${
            !this.check.correct && this.check.show
                ? ` ${this.prefixCls}-error`
                : ''
        }`
        return this.show ? <>
            { this.getMaskElem() }
            <div class={cls} style={style} ref={this.prefixCls}>
                { this.getArrowElem() }
                { this.getContentElem() }
            </div>
        </> : null
    }
})