# 文生图片 控制宽高比 +清晰度 

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1beta/models/{model-name}:generateContent:
    post:
      summary: '文生图片 控制宽高比 +清晰度 '
      deprecated: false
      description: >-
        使用谷歌的生图模型： gemini-2.5-flash-image (Banana
        小香蕉)，gemini-3-pro-image-preview( BananaPro 大香蕉) 支持 清晰度控制如下：

        "generationConfig": {
                "responseModalities": [
                    "TEXT",
                    "IMAGE"
                ],
                "imageConfig": {
                    "aspectRatio": "9:16",
                    "imageSize": "1K"
                }
            } 
        如果需要支持官方生图的不同参数（比如长宽比），令牌请使用google分组。
      tags:
        - 默认模块/谷歌Gemini 接口/原生格式
      parameters:
        - name: model-name
          in: path
          description: ''
          required: true
          schema:
            type: string
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
                            text:
                              type: string
                          x-apifox-orders:
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
                    - text: 生成一只猫
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
      x-apifox-folder: 默认模块/谷歌Gemini 接口/原生格式
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/5658530/apis/api-434039194-run
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