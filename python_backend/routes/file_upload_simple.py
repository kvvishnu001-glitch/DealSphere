import os
import tempfile
import csv
import json
import io
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db
from models import Deal

router = APIRouter()

@router.post("/upload-deals")
async def upload_deal_file(
    file: UploadFile = File(...),
    network: str = Form(...),
    description: str = Form(""),
    db: AsyncSession = Depends(get_db)
):
    """Simple file upload endpoint"""
    
    try:
        # Read file content
        content = await file.read()
        
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Parse CSV content
        csv_content = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        saved_deals = []
        processed_count = 0
        
        for row in csv_reader:
            processed_count += 1
            try:
                # Map CSV fields to deal model (match exact field names from models.py)
                deal_data = {
                    'id': str(uuid.uuid4()),  # Generate unique ID
                    'title': row.get('title', ''),
                    'description': row.get('description', ''),
                    'sale_price': float(row.get('price', 0)) if row.get('price') else 0,
                    'original_price': float(row.get('original_price', 0)) if row.get('original_price') else 0,
                    'image_url': row.get('image_url', ''),
                    'affiliate_url': row.get('product_url', ''),
                    'store': row.get('brand', network.title()),  # Use brand as store, fallback to network
                    'category': row.get('category', 'General'),
                    'rating': float(row.get('rating', 0)) if row.get('rating') else None,
                    'deal_type': 'file_upload',
                    'status': 'pending',
                    'is_active': True,
                    'is_ai_approved': False,
                    'click_count': 0,
                    'share_count': 0,
                    'discount_percentage': 0  # Will calculate below
                }
                
                # Calculate discount percentage
                if deal_data['sale_price'] and deal_data['original_price'] and deal_data['original_price'] > deal_data['sale_price']:
                    discount = ((deal_data['original_price'] - deal_data['sale_price']) / deal_data['original_price']) * 100
                    deal_data['discount_percentage'] = round(discount, 2)
                
                # Remove None values
                deal_data = {k: v for k, v in deal_data.items() if v is not None}
                
                # Save to database
                deal = Deal(**deal_data)
                db.add(deal)
                saved_deals.append(deal)
                
            except Exception as e:
                print(f"Error processing row {processed_count}: {e}")
                continue
        
        # Commit all deals to database
        await db.commit()
        
        return {
            'success': True,
            'message': f'Successfully uploaded {len(saved_deals)} deals from {file.filename}',
            'file_size': len(content),
            'network': network,
            'description': description,
            'processed_deals': processed_count,
            'valid_deals': len(saved_deals)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/upload-status")
async def get_upload_status():
    """Get upload status"""
    return {
        'status': 'ready',
        'max_file_size': '50MB',
        'supported_formats': ['csv', 'xlsx', 'json', 'xml'],
        'supported_networks': ['amazon', 'cj', 'shareasale', 'rakuten']
    }