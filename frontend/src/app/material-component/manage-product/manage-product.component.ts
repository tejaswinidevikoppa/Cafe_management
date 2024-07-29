import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { element } from 'protractor';
import { ProductService } from 'src/app/services/product.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { GlobalConstants } from 'src/app/shared/global-constants';
import { ConfirmationComponent } from '../dialog/confirmation/confirmation.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProductComponent } from '../dialog/product/product.component';

// import { ProductComponent } from '../dialog/product/product.component';

@Component({
  selector: 'app-manage-product',
  templateUrl: './manage-product.component.html',
  styleUrls: ['./manage-product.component.scss']
})
export class ManageProductComponent implements OnInit {
  displayedColumns: string[] = ['name','categoryName','description','price','edit'];
  dataSource:any;
  responseMessage:any;

  constructor(private productService: ProductService,
    private dialog:MatDialog,
    private router:Router,
    private snackbar:SnackbarService,
    private ngxService:NgxUiLoaderService) { }

  ngOnInit(): void {
    this.ngxService.start();
    this.tableData();
  }

  tableData(){ this.productService.getCategorys().subscribe((res:any)=>{
    this.ngxService.stop();
    this.dataSource = new MatTableDataSource(res);
  },(err:any)=>{
    this.ngxService.stop();
    if(err.error?.message){
      this.responseMessage = err.error?.message;
    }
    else{
      this.responseMessage = GlobalConstants.genericError;
    }
    this.snackbar.openSnackBar(this.responseMessage,GlobalConstants.error);
  })
}

applyFilter(event:Event){
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
}

add(){
  const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      action:'Add'
    }
    dialogConfig.width="850px";
    const dialogRef = this.dialog.open(ProductComponent,dialogConfig);
    this.router.events.subscribe(()=>{
      dialogRef.close();
    });
    const sub = dialogRef.componentInstance.onAddProduct.subscribe((res)=>{
      this.tableData();
    })
}

edit(element:any){
  const dialogConfig = new MatDialogConfig();
  dialogConfig.data = {
    action:'Edit',
    data:element
  }
  dialogConfig.width="850px";
  const dialogRef = this.dialog.open(ProductComponent,dialogConfig);
  this.router.events.subscribe(()=>{
    dialogRef.close();
  });
  const sub = dialogRef.componentInstance.onEditProduct.subscribe((res)=>{
    this.tableData();
  })
}

delete(element:any){
  const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      message:'delete ' + element.name + ' product'
    }
    dialogConfig.width="500px";
    const dialogRef = this.dialog.open(ConfirmationComponent,dialogConfig);
    const sub = dialogRef.componentInstance.onEmitStatusChange.subscribe((res)=>{
      this.ngxService.stop();
      this.deleteProduct(element.id);
      dialogRef.close();
    })
}

deleteProduct(id:any){
  this.productService.delete(id).subscribe((res:any)=>{
    this.tableData();
    this.responseMessage = res.message;
    this.snackbar.openSnackBar(this.responseMessage,"success");
  },(err:any)=>{
    this.ngxService.stop();
    if(err.error?.message){
      this.responseMessage = err.error?.message;
    }
    else{
      this.responseMessage = GlobalConstants.genericError;
    }
    this.snackbar.openSnackBar(this.responseMessage,GlobalConstants.error);
  })
}

onChange(status:any,id:any){
  var data ={
    status:status.toString(),
    id: id
  }
  this.productService.updateStatus(data).subscribe((res:any)=>{
    this.ngxService.stop();
    this.responseMessage = res.message;
    this.snackbar.openSnackBar(this.responseMessage,"success");
  },(err)=>{
    this.ngxService.stop();
    if(err.error?.message){
      this.responseMessage = err.error?.message;
    }
    else{
      this.responseMessage = GlobalConstants.genericError;
    }
    this.snackbar.openSnackBar(this.responseMessage,GlobalConstants.error);
  })
}
}
