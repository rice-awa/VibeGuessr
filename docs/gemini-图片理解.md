# 图片理解 

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1beta/models/gemini-2.0-flash:generateContent:
    post:
      summary: '图片理解 '
      deprecated: false
      description: 官方文档：https://ai.google.dev/gemini-api/docs/image-understanding?hl=zh-cn
      tags:
        - 默认模块/Chat模型/谷歌Gemini
      parameters:
        - name: key
          in: query
          description: ''
          required: true
          example: '{{YOUR_API_KEY}}'
          schema:
            type: string
        - name: Content-Type
          in: header
          description: ''
          required: true
          example: application/json
          schema:
            type: string
        - name: Authorization
          in: header
          description: ''
          example: Bearer  {{YOUR_API_KEY}}
          schema:
            type: string
            default: Bearer  {{YOUR_API_KEY}}
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                contents:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        type: string
                      parts:
                        type: array
                        items:
                          type: object
                          properties:
                            imageUrl:
                              type: string
                            text:
                              type: string
                          x-apifox-orders:
                            - imageUrl
                            - text
                    x-apifox-orders:
                      - role
                      - parts
              required:
                - contents
              x-apifox-orders:
                - contents
            example:
              contents:
                - role: user
                  parts:
                    - imageUrl: >-
                        https://image.baidu.com/front/aigc?atn=aigc&fr=home_hover&imgcontent=%7B%22aigcQuery%22%3A%22%22%2C%22imageAigcId%22%3A%22%22%7D&isImmersive=1&pd=image_content&quality=1&ratio=9%3A16&sa=searchpromo_shijian_photohp_inspire&tn=aigc&top=%7B%22sfhs%22%3A1%7D&word=%E5%B9%BF%E5%91%8A%E5%AE%A3%E4%BC%A0%E5%9B%BE%EF%BC%8C%E5%AE%A4%E5%86%85%E9%AB%98%E6%B8%85%EF%BC%8C%E5%B9%BF%E5%91%8A%EF%BC%8C%E6%B5%B7%E6%8A%A5%E8%B4%A8%E6%84%9F%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1%EF%BC%8C%E5%86%B0%E5%87%89%E7%9A%84%E6%B1%BD%E6%B0%B4%EF%BC%8C%E6%B0%B4%E6%9E%9C%E6%B1%BD%E6%B0%B4%EF%BC%8C%E6%B8%85%E6%96%B0%E7%9A%84%E8%87%AA%E7%84%B6%E7%8E%AF%E5%A2%83%EF%BC%8C%E8%B6%85%E9%AB%98%E6%B8%85%E5%88%86%E8%BE%A8%E7%8E%87%EF%BC%8C%E9%B2%9C%E8%89%B3%E8%89%B2%E5%BD%A9%EF%BC%8C%E6%B4%BB%E5%8A%9B%E5%9B%9B%E6%BA%A2%EF%BC%8C%E8%87%AA%E7%84%B6%E9%98%B3%E5%85%89%E7%85%A7%E5%B0%84%EF%BC%8C%E5%85%89%E6%BB%91%E5%86%B0%E5%87%8
                    - text: Caption this image.
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apifox-orders: []
          headers: {}
          x-apifox-name: 成功
      security:
        - bearer: []
      x-apifox-folder: 默认模块/Chat模型/谷歌Gemini
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/5658530/apis/api-319497344-run
components:
  schemas: {}
  securitySchemes:
    bearer:
      type: http
      scheme: bearer
    bearer1:
      type: bearer
      scheme: bearer
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
servers: []
security:
  - bearer: []

```