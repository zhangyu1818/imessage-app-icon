import { useState } from 'react'
import { Space, Card, Upload, Typography, Form, Button, Checkbox } from 'antd'
import Zip from 'jszip'
import { saveAs } from 'file-saver'

import 'antd/dist/antd.min.css'

import type { UploadChangeParam } from 'antd/lib/upload'

const squareSize = ['58x58', '87x87', '1024x1024', '58x58']

const rectSize = [
  '120x90',
  '180x135',
  '134x100',
  '148x110',
  '54x40',
  '81x60',
  '64x48',
  '96x72',
  '1024x768',
]

const getImage = (image: File): Promise<HTMLImageElement> =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(image)
    reader.onloadend = (e) => {
      const image = new Image()
      image.src = e.target!.result as string
      image.onload = () => resolve(image)
    }
  })

const createCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('style', 'position:absolute;top:-9999px;left:-9999px;')
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  const resize = (width: string, height: string) => {
    canvas.width = +width
    canvas.height = +height
  }

  const clear = () => ctx.clearRect(0, 0, canvas.width, canvas.height)

  return { canvas, ctx, resize, clear }
}

function App() {
  const [useSameImg, setUseSameImg] = useState(true)
  const [loading, setLoading] = useState(false)

  const readImgFile = (event: UploadChangeParam) => event.fileList

  return (
    <Card style={{ width: 'fit-content' }}>
      <Form
        onFinish={async (values) => {
          setLoading(true)
          let { img1024, img768 } = values

          if (!img768) img768 = img1024
          ;[img1024] = img1024
          ;[img768] = img768

          const zip = new Zip()
          const folder = zip.folder('icons')

          const { canvas, ctx, resize, clear } = createCanvas()

          for (const [baseImage, sizes] of [
            [img1024.originFileObj, squareSize],
            [img768.originFileObj, rectSize],
          ]) {
            const image = await getImage(baseImage)

            const toBlob = () =>
              new Promise((resolve) => canvas.toBlob(resolve))

            for (const size of sizes) {
              const [width, height] = size.split('x')
              clear()
              resize(width, height)
              ctx.drawImage(
                image,
                0,
                0,
                image.width,
                image.height,
                0,
                0,
                +width,
                +height
              )
              const blob = await toBlob()
              folder!.file(`${size}.png`, blob)
            }
          }

          const content = await zip.generateAsync({ type: 'blob' })
          saveAs(content, 'icons.zip')
          setLoading(false)
        }}
      >
        <Space direction='vertical'>
          <Typography.Title>iMessage App icon generator</Typography.Title>

          <Checkbox
            checked={useSameImg}
            onChange={({ target }) => setUseSameImg(target.checked)}
          >
            no image for 1024x768px
          </Checkbox>

          <Form.Item
            name='img1024'
            valuePropName='fileList'
            getValueFromEvent={readImgFile}
            style={{ marginBottom: 0 }}
            rules={[{ required: true, message: 'image is required.' }]}
          >
            <Upload maxCount={1} beforeUpload={() => false}>
              <Button>select image(1024x1024px)</Button>
            </Upload>
          </Form.Item>
          {!useSameImg && (
            <Form.Item
              name='img768'
              valuePropName='fileList'
              getValueFromEvent={readImgFile}
              rules={[{ required: true, message: 'image is required.' }]}
            >
              <Upload maxCount={1} beforeUpload={() => false}>
                <Button>select image(1024x768px)</Button>
              </Upload>
            </Form.Item>
          )}
          <Button
            loading={loading}
            style={{ float: 'right' }}
            type='primary'
            htmlType='submit'
          >
            Generator
          </Button>
        </Space>
      </Form>
    </Card>
  )
}

export default App
