{% extends './layout.swig' %}

{% block content %}
<form action="/" method="post">
  {{ formObj | raw }}
  {#{% for key, value in formObj %}#}
    {#<div>#}
      {#<span>{{ key }}</span>#}
      {#<input type="text" name="{{ value }}">#}
    {#</div>#}
  {#{% endfor %}#}
</form>
  <img src="data:image/png;base64,{{image}}" alt="">
{% endblock %}

{% block script %}
  <script src="//cdn.bootcss.com/jquery/3.1.0/jquery.min.js"></script>
  <script type="text/javascript">
    $(document).ready(function(){

      $("#cityId").hide();
      $("#unitId").hide();

      $(document).on("change","#unitId",function(){
        $('[name="unitName"]').val($(this).find(":checked").text());
      });

      $(document).on("change","#areaId",function(){
        var value = $(this).val();
        var val = parseInt(value);
        if(val == 0){
          $("#cityId").show();
          $("#cityId").attr("data-validation","checkAreaOrUnit");
          $("#unitId").hide();
          $("#unitId").val("");
          $('[name="unitName"]').val("");
        }else if(val >= 22 && val <= 24){
          $("#cityId").hide();
          $("#cityId").val("");
          $("#cityId").removeAttr("data-validation");
          $.ajax({
            url : '/dzTest.shtml?act=findKAreaUnit',
            data : {'parentId':value},
            async: false,
            type : 'post',
            dataType : 'json',
            success : function(result) {
              $(".newOpt").remove();
              $("#unitId").removeAttr("data-validation");
              if (result.length>0) {
                $("#unitId").show();
                for(var i=0;i<result.length;i++){
                  $("#unitId").attr("data-validation","checkAreaOrUnit");
                  $("#unitId").append("<option class='newOpt' value='"+result[i].id+"'>"+result[i].unitName+"</option>");
                }
              }else{
                $("#unitId").hide();
                $("#unitId").val("");
                $('[name="unitName"]').val("");
              }
            }
          });
        }else{
          $("#cityId").hide();
          $("#cityId").val("");
          $("#cityId").removeAttr("data-validation");
          $("#unitId").hide();
          $("#unitId").removeAttr("data-validation");
        }
      });

      $(document).on("change","#cityId",function(){
        var city_val = $(this).val();
        var city_id = parseInt(city_val);
        if(city_id != 0){
          $.ajax({
            url : '/dzTest.shtml?act=findKAreaUnit',
            data : {'parentId':city_id},
            async: false,
            type : 'post',
            dataType : 'json',
            success : function(result) {
              $(".newOpt").remove();
              $("#unitId").removeAttr("data-validation");
              if (result.length>0) {
                $("#unitId").show();
                $('[name="areaName"]').val($("#cityId").find(":checked").text());
                console.log($('[name="areaName"]').val())
                for(var i=0;i<result.length;i++){
                  $("#unitId").attr("data-validation","checkAreaOrUnit");
                  $("#unitId").append("<option class='newOpt' value='"+result[i].id+"'>"+result[i].unitName+"</option>");
                }
              }else{
                $("#unitId").hide();
                $("#unitId").val("");
                $('[name="unitName"]').val("");
              }
            }
          });
        }
      });
    });
  </script>
{% endblock %}