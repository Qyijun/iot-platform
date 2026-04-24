/**
 * ONVIF 视频服务 API 路由
 * 家庭监控项目
 */

const express = require('express');
const router = express.Router();
const onvifService = require('./onvif-service');

// 获取摄像头列表
router.get('/cameras', async (req, res) => {
  try {
    const cameras = await onvifService.getCameraList();
    res.json({
      success: true,
      data: cameras,
      total: cameras.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个摄像头详情
router.get('/cameras/:id', async (req, res) => {
  try {
    const camera = await onvifService.getCamera(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, error: '摄像头不存在' });
    }
    res.json({ success: true, data: camera });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加摄像头
router.post('/cameras', async (req, res) => {
  try {
    const { ip, port, username, password, name, location, rtspPath } = req.body;

    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP地址不能为空' });
    }

    const camera = await onvifService.addCamera({
      ip, port, username, password, name, location, rtspPath
    });

    res.json({ success: true, data: camera });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新摄像头配置
router.put('/cameras/:id', async (req, res) => {
  try {
    const { name, ip, port, username, password, location, rtspPath, status } = req.body;

    const camera = await onvifService.updateCamera(req.params.id, {
      name, ip, port, username, password, location, rtspPath, status
    });

    if (!camera) {
      return res.status(404).json({ success: false, error: '摄像头不存在' });
    }
    res.json({ success: true, data: camera });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除摄像头
router.delete('/cameras/:id', async (req, res) => {
  try {
    const success = await onvifService.deleteCamera(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: '摄像头不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 抓拍
router.post('/cameras/:id/capture', async (req, res) => {
  try {
    const baseUrl = req.protocol + '://' + req.get('host');
    const result = await onvifService.captureImage(req.params.id, baseUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 开始录像
router.post('/cameras/:id/record', async (req, res) => {
  try {
    const { duration } = req.body;
    const result = await onvifService.startRecording(req.params.id, duration);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取移动侦测事件
router.get('/cameras/:id/motion', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    const result = await onvifService.getMotionEvents(
      req.params.id,
      startTime,
      endTime
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ONVIF设备发现
router.get('/discover', async (req, res) => {
  try {
    const result = await onvifService.discoverDevices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取播放流地址
router.get('/stream/:id/url', async (req, res) => {
  try {
    const camera = await onvifService.getCamera(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, error: '摄像头不存在' });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const flvUrl = onvifService.getFlvUrl(camera, baseUrl);
    const rtspUrl = camera.rtspUrl;

    res.json({
      success: true,
      data: {
        cameraId: camera.id,
        cameraName: camera.name,
        rtspUrl,           // 原始RTSP地址
        flvUrl,            // HTTP-FLV地址（需后端转码）
        hlsUrl: `/stream/${camera.id}/live.m3u8`, // HLS地址
        wsFlvUrl: `ws://${req.get('host').split(':')[0]}:8888/live/${camera.id}` // WebSocket-FLV
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
