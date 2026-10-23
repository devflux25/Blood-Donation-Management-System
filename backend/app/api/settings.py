from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import SystemSetting
from app.schemas import SystemSettingOut, SystemSettingUpdate
from app.api.deps import require_admin, get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=List[SystemSettingOut])
def get_settings(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(SystemSetting).all()

@router.put("/{setting_key}", response_model=SystemSettingOut)
def update_setting(
    setting_key: str, 
    payload: SystemSettingUpdate, 
    db: Session = Depends(get_db), 
    admin = Depends(require_admin)
):
    setting = db.query(SystemSetting).filter(SystemSetting.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting key not found")

    setting.setting_value = payload.setting_value
    db.commit()
    db.refresh(setting)
    return setting
